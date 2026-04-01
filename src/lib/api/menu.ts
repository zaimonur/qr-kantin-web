/**
 * @file menu.ts
 * @description Menü ve stok yönetimi işlemlerini yürüten API servisleri.
 * @author Onur Zaim
 * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
 */

const API_URL = 'http://localhost:1323';

function getHeaders() {
	const token = localStorage.getItem('token');
	return {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${token}`
	};
}

// 1. Mevcut malzemeleri çek
export async function getMaterials() {
	const response = await fetch(`${API_URL}/admin/materials`, {
		method: 'GET',
		headers: getHeaders()
	});
	if (!response.ok) throw new Error('Malzemeler getirilemedi');
	const data = await response.json();
	return data || [];
}

// 2. Yeni malzeme ekle
export async function addMaterial(material: { name: string; stock_quantity: number; unit: string }) {
	const response = await fetch(`${API_URL}/admin/materials`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(material)
	});
	if (!response.ok) throw new Error('Malzeme eklenemedi');
	return await response.json();
}

// 3. YENİ: Ürün ve reçete ekle (category parametresi eklendi)
export async function addProduct(product: { name: string; price: number; category: string; materials: { material_id: string; quantity_needed: number }[] }) {
	const response = await fetch(`${API_URL}/admin/products`, {
		method: 'POST',
		headers: getHeaders(),
		body: JSON.stringify(product)
	});
	if (!response.ok) throw new Error('Ürün eklenemedi');
	return await response.json();
}

// 4. Mevcut malzemeyi sil
export async function deleteMaterial(id: string) {
	const response = await fetch(`${API_URL}/admin/materials/${id}`, {
		method: 'DELETE',
		headers: getHeaders()
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'Malzeme silinemedi');
	return data;
}

// Menüdeki mevcut ürünleri getir (Artık backend'den kategori de gelecek)
export async function getProducts() {
	const response = await fetch(`${API_URL}/admin/products`, {
		method: 'GET',
		headers: getHeaders()
	});
	if (!response.ok) throw new Error('Ürünler getirilemedi');
	const data = await response.json();
	return data || [];
}

// Menüden ürün sil
export async function deleteProduct(id: string) {
	const response = await fetch(`${API_URL}/admin/products/${id}`, {
		method: 'DELETE',
		headers: getHeaders()
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'Ürün silinemedi');
	return data;
}

// Ürünün mevcut reçetesini getir
export async function getProductRecipe(id: string) {
	const response = await fetch(`${API_URL}/admin/products/${id}/recipe`, {
		method: 'GET',
		headers: getHeaders()
	});
	if (!response.ok) throw new Error('Reçete getirilemedi');
	return await response.json();
}

// YENİ: Ürünü güncelle (category parametresi eklendi)
export async function updateProduct(id: string, product: { name: string; price: number; category: string; materials: { material_id: string; quantity_needed: number }[] }) {
	const response = await fetch(`${API_URL}/admin/products/${id}`, {
		method: 'PUT',
		headers: getHeaders(),
		body: JSON.stringify(product)
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.error || 'Ürün güncellenemedi');
	return data;
}