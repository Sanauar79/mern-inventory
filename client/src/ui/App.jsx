import React, { useEffect, useMemo, useState } from "react";
import {
  getProducts,
  updateProduct,
  deleteProduct,
  addProduct,
  exportCSV,
  importCSV,
  getHistory,
} from "../api";

function StatusBadge({ stock }) {
  const ok = Number(stock) > 0;
  return (
    <span className={`badge ${ok ? "green" : "red"}`}>
      {ok ? "In Stock" : "Out of Stock"}
    </span>
  );
}

function HistorySidebar({ open, onClose, product, logs }) {
  return (
    <div className={`sidebar ${open ? "open" : ""}`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Inventory History</h3>
        <button onClick={onClose}>✕</button>
      </div>
      {product && (
        <div style={{ marginBottom: 12 }}>
          <div><b>{product.name}</b></div>
          <div className="kbd">#{product._id}</div>
        </div>
      )}
      {!logs || logs.length === 0 ? (
        <div>No logs yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {logs.map((l) => (
            <li key={l._id} style={{ padding: "10px 0", borderTop: "1px solid #223" }}>
              <div>
                <b>Δ {l.delta > 0 ? "+" : ""}{l.delta}</b> (old: {l.oldQuantity}, new: {l.newQuantity})
              </div>
              <div className="kbd">{new Date(l.createdAt).toLocaleString()}</div>
              <div style={{ opacity: 0.8 }}>by {l.user}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || {});

  useEffect(() => {
    setForm(product || {});
  }, [product]);

  if (!product) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "stock" ? Number(value) : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await onSave(product._id, form);
    onClose();
  }

    return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Product</h3>
        <form onSubmit={handleSubmit}>
          <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Product Name" required />
          <input name="stock" type="number" value={form.stock ?? 0} onChange={handleChange} placeholder="Stock" />
          <input name="unit" value={form.unit || ""} onChange={handleChange} placeholder="Unit" />
          <input name="category" value={form.category || ""} onChange={handleChange} placeholder="Category" />
          <input name="brand" value={form.brand || ""} onChange={handleChange} placeholder="Brand" />
          <input name="image" value={form.image || ""} onChange={handleChange} placeholder="Image URL" />
          <div style={{ marginTop: 10 }}>
            <button type="submit" className="primary">Update</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function refresh() {
    const data = await getProducts({ name: search, category, page, limit, sortBy, sortDir });
    setItems(data.items || data.products || []);
    setTotal(data.total || 0);
  }

  useEffect(() => {
    refresh();
  }, [page, limit, sortBy, sortDir]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
    [items]
  );

  async function onEdit(id, updatedFields) {
  const updated = await updateProduct(id, updatedFields);
  setItems(prev => prev.map(p => p._id === id ? updated : p));
}

  async function onInlineChange(id, field, value) {
    const updated = await updateProduct(id, { [field]: field === "stock" ? Number(value) : value });
    setItems((prev) => prev.map((p) => (p._id === id ? updated : p)));
  }

  async function onDelete(id) {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    setItems((prev) => prev.filter((p) => p._id !== id));
  }

  async function onAdd(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      name: form.name.value,
      stock: Number(form.stock.value || 0),
      unit: form.unit.value,
      category: form.category.value,
      brand: form.brand.value,
      image: form.image.value,
    };
    const p = await addProduct(payload);
    setItems((prev) => [p, ...prev]);
    setShowForm(false);
  }

  async function onOpenHistory(p) {
    setSelected(p);
    const h = await getHistory(p._id);
    setLogs(h);
    setSidebarOpen(true);
  }

  async function onImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const res = await importCSV(file);
      alert(`Imported: ${res.created}, Skipped: ${res.skipped}`);
      refresh();
    };
    input.click();
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Products</h1>
        <div className="controls">
          <input
            placeholder="Search name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refresh()}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button className="ghost" onClick={refresh}>Search</button>
          <button className="primary" onClick={() => setShowForm(true)}>Add New Product</button>
          <button className="ghost" onClick={onImport}>Import</button>
          <button className="ghost" onClick={exportCSV}>Export</button>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Product</h3>
            <form onSubmit={onAdd}>
              <input name="name" placeholder="Product Name" required />
              <input name="stock" type="number" placeholder="Stock" />
              <input name="unit" placeholder="Unit" />
              <input name="category" placeholder="Category" />
              <input name="brand" placeholder="Brand" />
              <input name="image" placeholder="Image URL" />
              <div style={{ marginTop: 10 }}>
                <button type="submit" className="primary">Save</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            {["image", "name", "unit", "category", "brand", "stock", "status"].map((col) => (
              <th
                key={col}
                onClick={() => {
                  const map = { status: "status", stock: "stock", name: "name", image: "image", unit: "unit", category: "category", brand: "brand" };
                  const newBy = map[col] || "createdAt";
                  if (sortBy === newBy) {
                    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
                  } else {
                    setSortBy(newBy);
                    setSortDir("asc");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {col.charAt(0).toUpperCase() + col.slice(1)} {sortBy === col ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  {items.map((p) => {
    const isEditing = editingId === p._id;
    return (
      <tr key={p._id}>
        <td>
          {p.image ? (
            <img src={p.image} style={{ width: "50px", height: "50px", borderRadius: "6px" }} />
          ) : (
            "—"
          )}
        </td>

        <td>
          {isEditing ? (
            <InlineEdit value={p.name} onSave={(v) => onInlineChange(p._id, "name", v)} />
          ) : (
            p.name
          )}
        </td>

        <td>
          {isEditing ? (
            <InlineEdit value={p.unit || ""} onSave={(v) => onInlineChange(p._id, "unit", v)} />
          ) : (
            p.unit
          )}
        </td>

        <td>
          {isEditing ? (
            <InlineEdit value={p.category || ""} onSave={(v) => onInlineChange(p._id, "category", v)} />
          ) : (
            p.category
          )}
        </td>

        <td>
          {isEditing ? (
            <InlineEdit value={p.brand || ""} onSave={(v) => onInlineChange(p._id, "brand", v)} />
          ) : (
            p.brand
          )}
        </td>

        <td>
          {isEditing ? (
            <InlineEdit
              type="number"
              value={String(p.stock ?? 0)}
              onSave={(v) => onInlineChange(p._id, "stock", v)}
            />
          ) : (
            p.stock
          )}
        </td>

        <td><StatusBadge stock={p.stock} /></td>

        <td className="row-actions">
          <button onClick={() => onOpenHistory(p)}>History</button>
          {isEditing ? (
            <button onClick={() => setEditingId(null)}>Done</button>
          ) : (
            <button onClick={() => setEditingId(p._id)}>Edit</button>
          )}
          <button onClick={() => onDelete(p._id)}>Delete</button>
        </td>
      </tr>
    );
  })}
</tbody>

      </table>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <div>Total: {total}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Prev
          </button>
          <span className="kbd">Page {page} / {Math.max(1, Math.ceil(total / limit))}</span>
          <button onClick={() => setPage((p) => (p * limit < total ? p + 1 : p))} disabled={page * limit >= total}>
            Next
          </button>
        </div>
      </div>

      <HistorySidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} product={selected} logs={logs} />

        <EditModal
  product={editingProduct}
  onClose={() => setEditingProduct(null)}
  onSave={onEdit}
/>
    </div>
  );
}

function InlineEdit({ value, onSave, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div>
      {editing ? (
        <span>
          <input type={type} value={v} onChange={(e) => setV(e.target.value)} style={{ width: "100%" }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button className="primary" onClick={() => { onSave(v); setEditing(false); }}>Save</button>
            <button onClick={() => { setV(value); setEditing(false); }}>Cancel</button>
          </div>
        </span>
      ) : (
        <span onDoubleClick={() => setEditing(true)} title="Double-click to edit">{String(value || "—")}</span>
      )}
    </div>
  );
}

