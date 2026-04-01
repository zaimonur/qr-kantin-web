/**
 * @file users.ts
 * @description Kullanıcı işlemlerini yürüten API servisleri.
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

// Onay bekleyenleri getirir
export async function getPendingStudents() {
    const response = await fetch(`${API_URL}/admin/users/pending`, {
        method: 'GET',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Onay bekleyen öğrenciler getirilemedi');
    return await response.json();
}

// Öğrenciyi onaylar
export async function approveStudent(id: string, initialBalance: number) {
    const response = await fetch(`${API_URL}/admin/users/${id}/approve`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ balance: initialBalance })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Öğrenci onaylanamadı');
    return data;
}

// Onaylı tüm öğrencileri getirir (Bakiye yükleme ekranı için)
export async function getAllCustomers() {
    const response = await fetch(`${API_URL}/admin/users/students`, {
        method: 'GET',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Müşteri listesi alınamadı');
    return await response.json();
}

// Bakiye yükleme işlemi
export async function adminLoadBalance(userId: string, amount: number) {
    const response = await fetch(`${API_URL}/admin/users/${userId}/load-balance`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ balance: amount }) // Backend'deki ApproveRequest yapısına uyumlu olmalı
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Bakiye yüklenemedi');
    return data;
}

// Yeni Öğrenci Kaydı
export async function registerStudentByAdmin(fullName: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/admin/register/student`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ full_name: fullName, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Öğrenci kaydedilemedi');
    return data;
}

// Yeni Öğretmen Kaydı
export async function registerTeacherByAdmin(fullName: string, email: string, password: string) {
    const response = await fetch(`${API_URL}/admin/register/teacher`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ full_name: fullName, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Öğretmen kaydedilemedi');
    return data;
}