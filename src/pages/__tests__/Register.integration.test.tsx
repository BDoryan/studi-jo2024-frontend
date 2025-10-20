import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "@/tests/test-utils";
import { screen, waitFor } from "@testing-library/react";
import Register from "@/pages/Register";
import { HttpError } from "@/lib/api";

const authApiMocks = vi.hoisted(() => {
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
        AuthApi: authApiMocks.AuthApi,
    };
});

vi.mock("@/lib/auth", () => ({
    useAuth: () => authContextMock.useAuth(),
}));

describe("Register integration", () => {
    beforeEach(() => {
        authApiMocks.loginMock.mockReset();
        authApiMocks.registerMock.mockReset();
        authApiMocks.AuthApi.mockClear();
        authContextMock.useAuth.mockReset();

        authContextMock.useAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            token: null,
            user: null,
            login: vi.fn(),
            logout: vi.fn(),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("registers successfully when the form is valid", async () => {
        authApiMocks.registerMock.mockResolvedValue({
            message: "Bienvenue dans la billetterie !",
        });

        renderWithRouter(<Register />, {
            initialEntries: ["/register"],
            path: "/register",
        });

        const firstNameInput = screen.getAllByPlaceholderText("Alex")[0];
        const lastNameInput = screen.getAllByPlaceholderText("Dupont")[0];
        const emailInput = screen.getAllByPlaceholderText("vous@example.com")[0];
        await userEvent.type(firstNameInput, "Alex");
        await userEvent.type(lastNameInput, "Dupont");
        await userEvent.type(emailInput, "alex@example.com");
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/mot de passe/i);
        await userEvent.type(passwordInput, "Motdepasse64!");
        await userEvent.type(confirmPasswordInput, "Motdepasse64!");
        await userEvent.click(
            screen.getByRole("checkbox", {
                name: /j’accepte le traitement de mes données personnelles/i,
            }),
        );

        const submitButton = screen.getByRole("button", { name: "Créer mon compte" });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(authApiMocks.registerMock).toHaveBeenCalledWith({
                email: "alex@example.com",
                password: "Motdepasse64!",
                confirm_password: "Motdepasse64!",
                firstname: "Alex",
                lastname: "Dupont",
            });
        });

        expect(
            await screen.findByText("Bienvenue dans la billetterie !"),
        ).toBeInTheDocument();
    });

    it("blocks submission when passwords do not match", async () => {
        renderWithRouter(<Register />, {
            initialEntries: ["/register"],
            path: "/register",
        });

        const firstNameInput = screen.getAllByPlaceholderText("Alex")[0];
        const lastNameInput = screen.getAllByPlaceholderText("Dupont")[0];
        const emailInput = screen.getAllByPlaceholderText("vous@example.com")[0];
        await userEvent.type(firstNameInput, "Alex");
        await userEvent.type(lastNameInput, "Dupont");
        await userEvent.type(emailInput, "alex@example.com");
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/mot de passe/i);
        await userEvent.type(passwordInput, "Motdepasse64!");
        await userEvent.type(confirmPasswordInput, "AutreMotdepasse");
        await userEvent.click(
            screen.getByRole("checkbox", {
                name: /j’accepte le traitement de mes données personnelles/i,
            }),
        );

        const submitButton = screen.getByRole("button", { name: "Créer mon compte" });
        await userEvent.click(submitButton);

        expect(authApiMocks.registerMock).not.toHaveBeenCalled();
        const errors = await screen.findAllByText((content) =>
            content.includes("Les mots de passe ne correspondent pas"),
        );
        expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it("affiche une erreur lorsque l’API refuse l’inscription", async () => {
        authApiMocks.registerMock.mockRejectedValue(
            new HttpError({
                status: 409,
                message: "Cette adresse e-mail est déjà utilisée.",
            }),
        );

        renderWithRouter(<Register />, {
            initialEntries: ["/register"],
            path: "/register",
        });

        const firstNameInput = screen.getAllByPlaceholderText("Alex")[0];
        const lastNameInput = screen.getAllByPlaceholderText("Dupont")[0];
        const emailInput = screen.getAllByPlaceholderText("vous@example.com")[0];
        await userEvent.type(firstNameInput, "Alex");
        await userEvent.type(lastNameInput, "Dupont");
        await userEvent.type(emailInput, "alex@example.com");
        const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/mot de passe/i);
        await userEvent.type(passwordInput, "Motdepasse64!");
        await userEvent.type(confirmPasswordInput, "Motdepasse64!");
        await userEvent.click(
            screen.getByRole("checkbox", {
                name: /j’accepte le traitement de mes données personnelles/i,
            }),
        );

        const submitButton = screen.getByRole("button", { name: "Créer mon compte" });
        await userEvent.click(submitButton);

        await waitFor(() => {
            expect(authApiMocks.registerMock).toHaveBeenCalledTimes(1);
        });

        const alert = await screen.findByText(
            (_, element) => element?.classList.contains("text-red-700") ?? false,
        );
        expect(alert).toHaveTextContent(
            "Une erreur est survenue. Veuillez réessayer ou contacter le support si le problème persiste.",
        );
    });
});
