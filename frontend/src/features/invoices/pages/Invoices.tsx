import { useOutlet } from "react-router";
import InvoiceList from "./InvoiceList";

const Invoices = () => {
    const outlet = useOutlet();
    if (outlet) return outlet;
    return (
        <div className="p-4">
            <InvoiceList />
        </div>
    );
};

export default Invoices;
