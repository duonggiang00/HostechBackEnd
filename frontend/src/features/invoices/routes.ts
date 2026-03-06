import type { RouteConfig } from "../../shared/types/navigation";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/Create";
import EditInvoice from "./pages/Edit";
import InvoiceDetail from "./pages/Detail";
import DeletedInvoices from "./pages/DeletedInvoices";

export const invoiceRoutes: RouteConfig = {
  path: "invoices",
  Component: Invoices,
  children: [
    { path: "create", Component: CreateInvoice },
    { path: "edit/:id", Component: EditInvoice },
    { path: "detail/:id", Component: InvoiceDetail },
    { path: "deleted", Component: DeletedInvoices },
  ],
};
