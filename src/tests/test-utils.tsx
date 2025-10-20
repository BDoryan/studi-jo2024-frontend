import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

interface RenderWithRouterOptions {
    /**
     * Route pattern matching the element under test.
     * Defaults to the first entry in `initialEntries`.
     */
    path?: string;
    /**
     * Initial navigation entries for the in-memory router.
     */
    initialEntries?: string[];
}

export const renderWithRouter = (
    ui: ReactElement,
    options: RenderWithRouterOptions = {},
) => {
    const { initialEntries = ["/"], path } = options;
    const routePath = path ?? initialEntries[0] ?? "/";

    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path={routePath} element={ui} />
            </Routes>
        </MemoryRouter>,
    );
};
