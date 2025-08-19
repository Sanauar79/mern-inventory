import { useState, useEffect } from "react";

function EditModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product || {});

  useEffect(() => {
    setForm(product || {});
  }, [product]);

  if (!product) return null;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    await onSave(product._id, form);
    onClose();
  }

  return (
    <div className="modal-backdrop" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center"
    }}>
      <div className="modal" style={{
        background: "#fff", padding: "20px", borderRadius: "8px", width: "300px"
      }}>
        <h3>Edit Product</h3>

        <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Name" />
        <input name="unit" value={form.unit || ""} onChange={handleChange} placeholder="Unit" />
        <input name="category" value={form.category || ""} onChange={handleChange} placeholder="Category" />
        <input name="brand" value={form.brand || ""} onChange={handleChange} placeholder="Brand" />
        <input type="number" name="stock" value={form.stock || 0} onChange={handleChange} placeholder="Stock" />
        <input name="image" value={form.image || ""} onChange={handleChange} placeholder="Image URL" />

        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default EditModal;
