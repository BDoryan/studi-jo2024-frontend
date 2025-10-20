import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithRouter } from "@/tests/test-utils";
import Login from "@/pages/Login";
import { HttpError } from "@/lib/api";

const authModuleMocks = vi.hoisted(() => {
    const loginMock = vi.fn();
    const registerMock = vi.fn();
    const verifyLoginMock = vi.fn();
    return {
        loginMock,
        registerMock,
        verifyLoginMock,
        AuthApi: vi.fn().mockImplementation(() => ({
            login: loginMock,
            register: registerMock,
            verifyLogin: verifyLoginMock,
        })),
    };
});

const authContextMock = vi.hoisted(() => ({
    useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return {
        ...actual,
        AuthApi: authModuleMocks.AuthApi,
    };
});

vi.mock("@/lib/auth", async () => {
    const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
    return {
        ...actual,
        useAuth: () => authContextMock.useAuth(),
    };
});

describe("Login integration", () => {
    beforeEach(() => {
        authModuleMocks.loginMock.mockReset();
        authModuleMocks.registerMock.mockReset();
        authModuleMocks.verifyLoginMock.mockReset();
        authModuleMocks.AuthApi.mockClear();
        authContextMock.useAuth.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("authenticates successfully and shows confirmation", async () => {
        const applyAuthTokenMock = vi.fn().mockResolvedValue(undefined);
        authContextMock.useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            user: null,
            login: applyAuthTokenMock,
            logout: vi.fn(),
        });

        authModuleMocks.loginMock.mockResolvedValue({
            token: "token-123",
            two_factor_required: false,
        });

        renderWithRouter(<Login />, {
            initialEntries: ["/login"],
            path: "/login",
        });

        const emailInput = screen.getAllByLabelText(/adresse e-mail/i)[0];
        const passwordInput = screen.getAllByLabelText(/mot de passe/i)[0];

        await userEvent.type(emailInput, "fan@example.com");
        await userEvent.type(passwordInput, "secretpass");

        const submitButton =
            screen.getAllByRole("button", { name: "Se connecter" }).find((button) =>
                button.closest("form"),
            ) ?? screen.getByRole("button", { name: "Se connecter" });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(authModuleMocks.loginMock).toHaveBeenCalledWith({
                email: "fan@example.com",
                password: "secretpass",
            });
        });
        expect(authModuleMocks.loginMock).toHaveBeenCalledTimes(1);
        expect(authModuleMocks.verifyLoginMock).not.toHaveBeenCalled();

        await waitFor(() => {
            expect(applyAuthTokenMock).toHaveBeenCalledWith("token-123");
        });

        expect(await screen.findByText("Connexion réussie.")).toBeInTheDocument();
    });

    it("performs OTP verification when two-factor authentication is required", async () => {
        const applyAuthTokenMock = vi.fn().mockResolvedValue(undefined);
        authContextMock.useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            user: null,
            login: applyAuthTokenMock,
            logout: vi.fn(),
        });

        authModuleMocks.loginMock.mockResolvedValue({
            token: null,
            two_factor_required: true,
            challenge_id: "challenge-123",
        });
        authModuleMocks.verifyLoginMock.mockResolvedValue({
            token: "token-456",
            two_factor_required: false,
        });

        renderWithRouter(<Login />, {
            initialEntries: ["/login"],
            path: "/login",
        });

        const emailInput = screen.getAllByLabelText(/adresse e-mail/i)[0];
        const passwordInput = screen.getAllByLabelText(/mot de passe/i)[0];
        await userEvent.type(emailInput, "fan@example.com");
        await userEvent.type(passwordInput, "secretpass");

        const submitButton =
            screen.getAllByRole("button", { name: "Se connecter" }).find((button) =>
                button.closest("form"),
            ) ?? screen.getByRole("button", { name: "Se connecter" });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(authModuleMocks.loginMock).toHaveBeenCalledWith({
                email: "fan@example.com",
                password: "secretpass",
            });
        });

        const codeInput = await screen.findByLabelText(/code de vérification/i);
        await userEvent.type(codeInput, "123456");

        const verifyButton = screen.getByRole("button", { name: "Valider le code" });
        await userEvent.click(verifyButton);

        await waitFor(() => {
            expect(authModuleMocks.verifyLoginMock).toHaveBeenCalledWith({
                challenge_id: "challenge-123",
                code: "123456",
            });
        });
        expect(applyAuthTokenMock).toHaveBeenCalledWith("token-456");
    });

    it("displays backend errors during OTP verification", async () => {
        const applyAuthTokenMock = vi.fn().mockResolvedValue(undefined);
        authContextMock.useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            user: null,
            login: applyAuthTokenMock,
            logout: vi.fn(),
        });

        authModuleMocks.loginMock.mockResolvedValue({
            token: null,
            two_factor_required: true,
            challenge_id: "challenge-987",
        });
        authModuleMocks.verifyLoginMock.mockRejectedValue(
            new HttpError({
                status: 400,
                message: "Code invalide ou expiré.",
                details: null,
            }),
        );

        renderWithRouter(<Login />, {
            initialEntries: ["/login"],
            path: "/login",
        });

        const emailInput = screen.getAllByLabelText(/adresse e-mail/i)[0];
        const passwordInput = screen.getAllByLabelText(/mot de passe/i)[0];
        await userEvent.type(emailInput, "fan@example.com");
        await userEvent.type(passwordInput, "secretpass");

        const submitButton =
            screen.getAllByRole("button", { name: "Se connecter" }).find((button) =>
                button.closest("form"),
            ) ?? screen.getByRole("button", { name: "Se connecter" });
        await userEvent.click(submitButton);

        const codeInput = await screen.findByLabelText(/code de vérification/i);
        await userEvent.type(codeInput, "123456");

        const verifyButton = screen.getByRole("button", { name: "Valider le code" });
        await userEvent.click(verifyButton);

        await waitFor(() => {
            expect(authModuleMocks.verifyLoginMock).toHaveBeenCalledWith({
                challenge_id: "challenge-987",
                code: "123456",
            });
        });

        expect(applyAuthTokenMock).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(codeInput).toHaveAttribute("aria-describedby", "login-otp-error");
            const node = document.getElementById("login-otp-error");
            expect(node?.textContent).toBeTruthy();
        });
    });

    it("surface API validation errors returned by the backend", async () => {
        const applyAuthTokenMock = vi.fn().mockResolvedValue(undefined);
        authContextMock.useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            user: null,
            login: applyAuthTokenMock,
            logout: vi.fn(),
        });

        authModuleMocks.loginMock.mockRejectedValue(
            new HttpError({
                status: 401,
                message: "Adresse e-mail ou mot de passe incorrect.",
                details: null,
            }),
        );

        renderWithRouter(<Login />, {
            initialEntries: ["/login"],
            path: "/login",
        });

        const emailInput = screen.getAllByLabelText(/adresse e-mail/i)[0];
        const passwordInput = screen.getAllByLabelText(/mot de passe/i)[0];

        await userEvent.type(emailInput, "fan@example.com");
        await userEvent.type(passwordInput, "wrongpass");

        const submitButton =
            screen.getAllByRole("button", { name: "Se connecter" }).find((button) =>
                button.closest("form"),
            ) ?? screen.getByRole("button", { name: "Se connecter" });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(authModuleMocks.loginMock).toHaveBeenCalledTimes(1);
        });

        expect(applyAuthTokenMock).not.toHaveBeenCalled();
        expect(authModuleMocks.verifyLoginMock).not.toHaveBeenCalled();
        const alert = await screen.findByText(
            (_, element) => element?.classList.contains("text-red-700") ?? false,
        );
        expect(alert).toHaveTextContent(
            "Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.",
        );
    });
});
