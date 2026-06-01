import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "./api";
import "./styles.css";

const emptyProduct = { name: "", sku: "", price: "", quantity_in_stock: "" };
const emptyCustomer = { full_name: "", email: "", phone: "" };

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function Message({ notice }) {
  if (!notice.text) return null;
  const Icon = notice.type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className={`notice ${notice.type}`} role="status">
      <Icon size={18} />
      <span>{notice.text}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProductForm({ onSubmit, editing, onCancel }) {
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    setForm(editing ? {
      name: editing.name,
      sku: editing.sku,
      price: editing.price,
      quantity_in_stock: editing.quantity_in_stock,
    } : emptyProduct);
  }, [editing]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    });
    if (!editing) setForm(emptyProduct);
  }

  return (
    <form className="form" onSubmit={submit}>
      <input required placeholder="Product name" value={form.name} onChange={(e) => update("name", e.target.value)} />
      <input required placeholder="SKU / code" value={form.sku} onChange={(e) => update("sku", e.target.value)} />
      <input required min="0" step="0.01" type="number" placeholder="Price" value={form.price} onChange={(e) => update("price", e.target.value)} />
      <input required min="0" step="1" type="number" placeholder="Stock" value={form.quantity_in_stock} onChange={(e) => update("quantity_in_stock", e.target.value)} />
      <button type="submit"><Plus size={16} />{editing ? "Update" : "Add"}</button>
      {editing && <button className="secondary" type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

function CustomerForm({ onSubmit }) {
  const [form, setForm] = useState(emptyCustomer);

  function submit(event) {
    event.preventDefault();
    onSubmit({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setForm(emptyCustomer);
  }

  return (
    <form className="form" onSubmit={submit}>
      <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input required placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <button type="submit"><Plus size={16} />Add</button>
    </form>
  );
}

function OrderForm({ products, customers, onSubmit }) {
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: 1 }]);

  const estimatedTotal = items.reduce((sum, item) => {
    const selectedProduct = products.find((product) => product.id === Number(item.product_id));
    return sum + (selectedProduct ? Number(selectedProduct.price) * Number(item.quantity || 0) : 0);
  }, 0);

  function updateItem(index, field, value) {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      customer_id: Number(customerId),
      items: items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })),
    });
    setItems([{ product_id: "", quantity: 1 }]);
  }

  return (
    <form className="order-builder" onSubmit={submit}>
      <div className="form order-header">
        <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select customer</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name}</option>)}
        </select>
        <output>{money(estimatedTotal)}</output>
        <button type="submit"><ClipboardList size={16} />Create</button>
      </div>
      <div className="order-lines">
        {items.map((item, index) => (
          <div className="order-line" key={index}>
            <select required value={item.product_id} onChange={(e) => updateItem(index, "product_id", e.target.value)}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} ({product.quantity_in_stock} in stock)</option>
              ))}
            </select>
            <input required min="1" step="1" type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} />
            <button
              className="icon-button danger"
              type="button"
              onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              disabled={items.length === 1}
              aria-label="Remove order line"
              title="Remove line"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button className="secondary add-line" type="button" onClick={() => setItems((current) => [...current, { product_id: "", quantity: 1 }])}>
        <Plus size={16} />Add line
      </button>
    </form>
  );
}

function App() {
  const [dashboard, setDashboard] = useState({ total_products: 0, total_customers: 0, total_orders: 0, low_stock_products: 0 });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [summary, productList, customerList, orderList] = await Promise.all([
        api.dashboard(),
        api.products.list(),
        api.customers.list(),
        api.orders.list(),
      ]);
      setDashboard(summary);
      setProducts(productList);
      setCustomers(customerList);
      setOrders(orderList);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function run(action, success) {
    try {
      await action();
      setNotice({ type: "success", text: success });
      await loadAll();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    }
  }

  const lowStock = useMemo(
    () => products.filter((product) => product.quantity_in_stock <= 5),
    [products],
  );

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p>Operations Console</p>
          <h1>Inventory & Order Management</h1>
        </div>
        <button className="icon-button" onClick={loadAll} aria-label="Refresh data" title="Refresh data">
          <RefreshCw size={18} />
        </button>
      </header>

      <Message notice={notice} />

      <section className="stats" aria-label="Dashboard summary">
        <Stat icon={Boxes} label="Products" value={dashboard.total_products} />
        <Stat icon={Users} label="Customers" value={dashboard.total_customers} />
        <Stat icon={ClipboardList} label="Orders" value={dashboard.total_orders} />
        <Stat icon={AlertCircle} label="Low Stock" value={dashboard.low_stock_products} />
      </section>

      <section className="workspace">
        <div className="panel">
          <div className="panel-title">
            <h2>Products</h2>
            <span>{loading ? "Loading" : `${products.length} records`}</span>
          </div>
          <ProductForm
            editing={editingProduct}
            onCancel={() => setEditingProduct(null)}
            onSubmit={(payload) => run(
              () => editingProduct ? api.products.update(editingProduct.id, payload) : api.products.create(payload),
              editingProduct ? "Product updated" : "Product added",
            ).then(() => setEditingProduct(null))}
          />
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{money(product.price)}</td>
                    <td><span className={product.quantity_in_stock <= 5 ? "pill danger" : "pill"}>{product.quantity_in_stock}</span></td>
                    <td className="actions">
                      <button className="icon-button" onClick={() => setEditingProduct(product)} aria-label={`Edit ${product.name}`} title="Edit product"><Pencil size={16} /></button>
                      <button className="icon-button danger" onClick={() => run(() => api.products.remove(product.id), "Product deleted")} aria-label={`Delete ${product.name}`} title="Delete product"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <h2>Customers</h2>
            <span>{customers.length} records</span>
          </div>
          <CustomerForm onSubmit={(payload) => run(() => api.customers.create(payload), "Customer added")} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th></th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.full_name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td className="actions">
                      <button className="icon-button danger" onClick={() => run(() => api.customers.remove(customer.id), "Customer deleted")} aria-label={`Delete ${customer.full_name}`} title="Delete customer"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel wide">
          <div className="panel-title">
            <h2>Orders</h2>
            <span>{orders.length} records</span>
          </div>
          <OrderForm products={products} customers={customers} onSubmit={(payload) => run(() => api.orders.create(payload), "Order created and stock updated")} />
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.items.map((item) => `${item.product_name} x ${item.quantity}`).join(", ")}</td>
                    <td>{money(order.total_amount)}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button className="icon-button danger" onClick={() => run(() => api.orders.remove(order.id), "Order cancelled and stock restored")} aria-label={`Cancel order ${order.id}`} title="Cancel order"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {lowStock.length > 0 && (
        <section className="low-stock">
          <h2>Low Stock Watchlist</h2>
          <div className="watchlist">
            {lowStock.map((product) => <span key={product.id}>{product.name}: {product.quantity_in_stock}</span>)}
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
