const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export async function getProducts(params={}){
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/products?${q}`);
  return res.json();
}
export async function addProduct(payload){
  const res = await fetch(`${API_BASE}/products`, {
    method:"POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}
export async function updateProduct(id, payload){
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method:"PUT",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}
export async function deleteProduct(id){
  const res = await fetch(`${API_BASE}/products/${id}`, { method:"DELETE" });
  return res.json();
}
export async function getHistory(id){
  const res = await fetch(`${API_BASE}/products/${id}/history`);
  return res.json();
}
export async function exportCSV(){
  window.location.href = `${API_BASE}/products/export`;
}
export async function importCSV(file){
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/products/import`, { method:"POST", body: fd });
  return res.json();
}