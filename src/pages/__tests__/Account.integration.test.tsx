import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithRouter } from "@/tests/test-utils";
import { screen, waitFor } from "@testing-library/react";
import Account from "@/pages/Account";
import type { Ticket } from "@/lib/api";

const apiMocks = vi.hoisted(() => {
    const getProfile = vi.fn();
    const getTickets = vi.fn();
    const getStatus = vi.fn();
    return {
        getProfile,
        getTickets,
        getStatus,
    };
});

const authContextMock = vi.hoisted(() => ({
    useAuth: vi.fn(),
}));

const pdfMocks = vi.hoisted(() => {
    const saveMock = vi.fn();

    class FakeJsPdf {
        setFillColor = vi.fn();
        roundedRect = vi.fn();
        setTextColor = vi.fn();
        setFontSize = vi.fn();
        setFont = vi.fn();
        text = vi.fn();
        addImage = vi.fn();
        setDrawColor = vi.fn();
        setLineWidth = vi.fn();
        setLineDashPattern = vi.fn();
        line = vi.fn();
        save = saveMock;
        internal = {
            pageSize: {
                getWidth: () => 595,
            },
        };
    }

    const loadJsPdf = vi.fn(async () => FakeJsPdf);

    return {
        saveMock,
        FakeJsPdf,
        loadJsPdf,
    };
});

vi.mock("@/lib/api", async () => {
    const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

    class MockCustomerApi {
        getProfile = apiMocks.getProfile;
        getTickets = apiMocks.getTickets;
    }

    class MockPaymentsApi {
        getStatus = apiMocks.getStatus;
    }

    return {
        ...actual,
        CustomerApi: MockCustomerApi,
        PaymentsApi: MockPaymentsApi,
    };
});

vi.mock("@/lib/auth", () => ({
    useAuth: () => authContextMock.useAuth(),
}));

vi.mock("@/lib/pdf/jspdfLoader", () => ({
    loadJsPdf: pdfMocks.loadJsPdf,
}));

const originalFetch = globalThis.fetch;
const originalFileReader = globalThis.FileReader as typeof FileReader | undefined;

describe("Account integration", () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        apiMocks.getProfile.mockReset();
        apiMocks.getTickets.mockReset();
        apiMocks.getStatus.mockReset();
        authContextMock.useAuth.mockReset();
        pdfMocks.loadJsPdf.mockClear();
        pdfMocks.saveMock.mockReset();

        authContextMock.useAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            token: "token-abc",
            user: {
                id: "user-1",
                email: "alex@example.com",
                firstName: "Alex",
                lastName: "Dupont",
                full_name: "Alex Dupont",
                role: "customer",
            },
            login: vi.fn(),
            logout: vi.fn(),
        });

        apiMocks.getProfile.mockResolvedValue({
            firstname: "Alex",
            lastname: "Dupont",
            email: "alex@example.com",
        });

        const ticket: Ticket = {
            ticketId: 123,
            ticket_secret: "secret-123",
            status: "VALID",
            entriesAllowed: 1,
            offerName: "Pack Natation",
            amount: 120,
            transactionStatus: "PAID",
            createdAt: "2024-05-01T10:00:00.000Z",
        };

        apiMocks.getTickets.mockResolvedValue([ticket]);

        fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            if (typeof input === "string" && input.includes("create-qr-code")) {
                const blob = new Blob(["fake-image"], { type: "image/png" });
                return {
                    ok: true,
                    status: 200,
                    blob: async () => blob,
                } as Response;
            }

            return {
                ok: true,
                status: 200,
                json: async () => ({}),
            } as Response;
        });

        globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

        class FileReaderStub {
            public result: string | ArrayBuffer | null = null;
            public onload: ((event: ProgressEvent<FileReader>) => void) | null = null;

            readAsDataURL(): void {
                this.result = "data:image/png;base64,ZmFrZQ==";
                if (this.onload) {
                    this.onload({} as ProgressEvent<FileReader>);
                }
            }
        }

        globalThis.FileReader = FileReaderStub as unknown as typeof FileReader;
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;

        if (originalFileReader) {
            globalThis.FileReader = originalFileReader;
        } else {
            delete (globalThis as Record<string, unknown>).FileReader;
        }
        vi.clearAllMocks();
    });

    it("permet de télécharger un billet client", async () => {
        renderWithRouter(<Account />, {
            initialEntries: ["/account"],
            path: "/account",
        });

        expect(await screen.findByText("alex@example.com")).toBeInTheDocument();
        expect(screen.getByText("Pack Natation")).toBeInTheDocument();

        const downloadButton = await screen.findByRole("button", {
            name: "Télécharger mon billet",
        });
        await userEvent.click(downloadButton);

        await waitFor(() => {
            expect(pdfMocks.loadJsPdf).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(pdfMocks.saveMock).toHaveBeenCalledWith("billet-123.pdf");
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=secret-123",
            { mode: "cors" },
        );
    });
});
