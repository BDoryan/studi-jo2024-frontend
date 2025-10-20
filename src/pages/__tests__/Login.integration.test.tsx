import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithRouter } from "@/tests/test-utils";
import Login from "@/pages/Login";
import { HttpError } from "@/lib/api";

const authModuleMocks = vi.hoisted(() => {
    const loginMock = vi.fn();
    const registerMock = vi.fn();
    return {
        loginMock,
        registerMock,
        AuthApi: vi.fn().mockImplementation(() => ({
            login: loginMock,
            register: registerMock,
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

vi.mock("@/lib/auth", () => ({
    useAuth: () => authContextMock.useAuth(),
}));

describe("Login integration", () => {
    beforeEach(() => {
        authModuleMocks.loginMock.mockReset();
        authModuleMocks.registerMock.mockReset();
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

        authModuleMocks.loginMock.mockResolvedValue({ token: "token-123" });

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

        await waitFor(() => {
            expect(applyAuthTokenMock).toHaveBeenCalledWith("token-123");
        });

        expect(await screen.findByText("Connexion réussie.")).toBeInTheDocument();
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
        const alert = await screen.findByText(
            (_, element) => element?.classList.contains("text-red-700") ?? false,
        );
        expect(alert).toHaveTextContent(
            "Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.",
        );
    });
});
