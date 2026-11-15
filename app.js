// ==========================================
// 1. KONEKSI FIREBASE (DATABASE ONLINE)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnS8fdTvX-mk86T9kNBOE7p8CaF6CRDNI",
  authDomain: "toko-ikan-99.firebaseapp.com",
  databaseURL: "https://toko-ikan-99-default-rtdb.firebaseio.com",
  projectId: "toko-ikan-99",
  storageBucket: "toko-ikan-99.firebasestorage.app",
  messagingSenderId: "806800295561",
  appId: "1:806800295561:web:a547e3a3b752124d9e858",
  measurementId: "G-VN3YHXSBR"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// 2. DATA & KONFIGURASI AWAL
// ==========================================
const USERS = [
  { username: "kasir", password: "123", role: "kasir", redirect: "dashboard.html" },
  { username: "admin", password: "888", role: "admin", redirect: "dashboard.html" }
];

let dataStok = [
  { id: 1, kategori: "ikan", nama: "Ikan Gurame Segar", hargaEceran: 45000, hargaGrosir: 38000, stok: 20 },
  { id: 2, kategori: "ikan", nama: "Ikan Nila Merah", hargaEceran: 32000, hargaGrosir: 27000, stok: 35 },
  { id: 3, kategori: "barang", nama: "Pakan Ikan Pelet 1kg", hargaEceran: 20000, hargaGrosir: 16500, stok: 50 },
  { id: 4, kategori: "mesin", nama: "Mesin Aerator Oksigen 1 Lubang", hargaEceran: 45000, hargaGrosir: 38000, stok: 15 },
  { id: 5, kategori: "aquarium", nama: "Aquarium Kaca Custom", ukuran: {p: 60, l: 30, t: 35}, hargaEceran: 150000, hargaGrosir: 130000, stok: 3 }
];

let dataRiwayat = [];
let dataCatatanModal = [];
let keranjang = [];
let tipePenjualan = 'eceran';
let kategoriAktifKasir = 'semua';
let kategoriAktifAdmin = 'ikan';

onValue(ref(db, 'toko_ikan_stok/'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    dataStok = data;
    refreshTampilanAktif();
  } else {
    set(ref(db, 'toko_ikan_stok/'), dataStok);
  }
});

onValue(ref(db, 'toko_ikan_riwayat/'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    dataRiwayat = Object.keys(data).map(key => ({ idFirebase: key, ...data[key] }));
  } else {
    dataRiwayat = [];
  }
  refreshTampilanAktif();
});

onValue(ref(db, 'toko_ikan_modal/'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    dataCatatanModal = Object.keys(data).map(key => ({ idFirebase: key, ...data[key] }));
  } else {
    dataCatatanModal = [];
  }
  refreshTampilanAktif();
});

function simpanStorage() {
  set(ref(db, 'toko_ikan_stok/'), dataStok);
}

function refreshTampilanAktif() {
  if (typeof renderDashboardStats === 'function') renderDashboardStats();
  if (typeof renderKasirProduk === 'function') renderKasirProduk();
  if (typeof renderTabelAdmin === 'function') renderTabelAdmin();
  if (typeof renderTabelRiwayat === 'function') renderTabelRiwayat();
}

// ==========================================
// 3. OTENTIKASI & LOGIN
// ==========================================
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const uInput = document.getElementById('login-username').value.trim();
    const pInput = document.getElementById('login-password').value.trim();
    const userFound = USERS.find(u => u.username === uInput && u.password === pInput);
    
    if (userFound) {
      localStorage.setItem('user_session', JSON.stringify({ username: userFound.username, role: userFound.role }));
      window.location.href = userFound.redirect;
    } else {
      alert('Username atau Password salah!');
    }
  });
}

function checkAuth(roleReq) {
  const session = JSON.parse(localStorage.getItem('user_session'));
  if (!session) {
    alert('Akses ditolak! Silakan login terlebih dahulu.');
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('user_session');
  window.location.href = 'index.html';
}

// ==========================================
// 4. NAVIGASI MENU SIDEBAR (OPTIMASI TOMBOL KEMBALI HP)
// ==========================================
function pilihMenu(menu, pushHistory = true) {
  ['view-dashboard', 'view-kasir', 'view-stok', 'view-riwayat'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });

  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.className = "menu-btn w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer relative group";
  });

  const activeBtn = document.getElementById('menu-btn-' + menu);
  if(activeBtn) {
    activeBtn.className = "menu-btn w-10 h-10 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center text-white bg-indigo-600 shadow-lg shadow-indigo-600/30 transition cursor-pointer relative group";
  }

  if (typeof resetFormAdmin === 'function') resetFormAdmin();

  const breadcrumb = document.getElementById('header-breadcrumb');

  if (pushHistory && window.history && window.history.replaceState) {
    window.history.replaceState({ activeMenu: menu }, "", `#${menu}`);
  }

  if (menu === 'dashboard') {
    document.getElementById('view-dashboard').classList.remove('hidden');
    if(breadcrumb) breadcrumb.innerText = "DASHBOARD & KEUANGAN";
    renderDashboardStats();
  } else if (menu === 'kasir') {
    document.getElementById('view-kasir').classList.remove('hidden');
    if(breadcrumb) breadcrumb.innerText = "KASIR / POS";
    renderKasirProduk();
  } else if (menu === 'riwayat') {
    document.getElementById('view-riwayat').classList.remove('hidden');
    if(breadcrumb) breadcrumb.innerText = "RIWAYAT TRANSAKSI";
    renderTabelRiwayat();
  } else {
    document.getElementById('view-stok').classList.remove('hidden');
    kategoriAktifAdmin = menu;
    const judulMap = { ikan: "Manajemen Stok Ikan", barang: "Manajemen Stok Barang", mesin: "Manajemen Stok Mesin", aquarium: "Manajemen Stok Aquarium" };
    if(document.getElementById('stok-judul-halaman')) document.getElementById('stok-judul-halaman').innerText = judulMap[menu];
    if(breadcrumb) breadcrumb.innerText = judulMap[menu].toUpperCase();

    const boxKalkulator = document.getElementById('kalkulator-aquarium-box');
    const inputHargaNormal = document.getElementById('input-harga-normal');

    if (boxKalkulator && inputHargaNormal) {
      if (menu === 'aquarium') {
        boxKalkulator.style.display = 'block';
        inputHargaNormal.style.display = 'none';
      } else {
        boxKalkulator.style.display = 'none';
        inputHargaNormal.style.display = 'block';
      }
    }
    renderTabelAdmin();
  }
}

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.activeMenu) {
    pilihMenu(event.state.activeMenu, false);
  } else {
    pilihMenu('dashboard', false);
  }
});

// ==========================================
// 5. DASHBOARD & KEUANGAN
// ==========================================
function renderDashboardStats() {
  const statOmzet = document.getElementById('stat-omzet');
  const statModal = document.getElementById('stat-modal');
  const statProfit = document.getElementById('stat-profit');
  const statTotalProduk = document.getElementById('stat-total-produk');
  const statStokTipis = document.getElementById('stat-stok-tipis');
  const listCatatan = document.getElementById('list-catatan-modal');
  const grafikContainer = document.getElementById('grafik-7-hari');

  let totalOmzetHariIni = 0;
  let totalModalHariIni = 0;
  const hariIniStr = new Date().toLocaleDateString('id-ID');

  dataRiwayat.forEach(trx => {
    if (trx.tanggal && trx.tanggal.includes(hariIniStr)) totalOmzetHariIni += trx.total || 0;
  });

  dataCatatanModal.forEach(cat => {
    if (cat.tanggal && cat.tanggal.includes(hariIniStr)) totalModalHariIni += cat.nominal || 0;
  });

  const profitBersih = totalOmzetHariIni - totalModalHariIni;
  if(statOmzet) statOmzet.innerText = "Rp " + totalOmzetHariIni.toLocaleString('id-ID');
  if(statModal) statModal.innerText = "Rp " + totalModalHariIni.toLocaleString('id-ID');
  if(statProfit) statProfit.innerText = "Rp " + profitBersih.toLocaleString('id-ID');
  if(statTotalProduk) statTotalProduk.innerText = dataStok.length;
  if(statStokTipis) statStokTipis.innerText = dataStok.filter(item => item.stok <= 5).length;

  if (listCatatan) {
    if (dataCatatanModal.length === 0) {
      listCatatan.innerHTML = '<p class="text-slate-400 text-center py-12">Belum ada catatan keuangan.</p>';
    } else {
      listCatatan.innerHTML = '';
      dataCatatanModal.slice().reverse().forEach(cat => {
        listCatatan.innerHTML += `
          <div class="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <div>
              <p class="font-bold text-slate-800">${cat.keterangan}</p>
              <p class="text-[10px] text-slate-400">${cat.tanggal}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-rose-600">Rp ${cat.nominal.toLocaleString('id-ID')}</span>
              <button onclick="hapusCatatanModal('${cat.idFirebase}')" class="text-red-400 hover:text-red-600 font-bold cursor-pointer">✕</button>
            </div>
          </div>
        `;
      });
    }
  }

  if (grafikContainer) {
    grafikContainer.innerHTML = '';
    const hariArray = [0, 0, 0, 0, 0, 0, totalOmzetHariIni];
    const maxVal = Math.max(...hariArray, 100000);
    hariArray.forEach(val => {
      const tinggiPersen = Math.max((val / maxVal) * 100, 10);
      grafikContainer.innerHTML += `
        <div class="flex flex-col items-center h-full justify-end gap-2 w-10 shrink-0">
          <span class="text-[9px] font-bold text-indigo-600">${val > 0 ? 'Rp ' + (val/1000).toFixed(0) + 'k' : '0'}</span>
          <div class="w-6 bg-indigo-600 rounded-t-xl transition-all duration-500" style="height: ${tinggiPersen}%"></div>
        </div>
      `;
    });
  }
}

function simpanCatatanModal(e) {
  e.preventDefault();
  const keterangan = document.getElementById('ket-modal').value;
  const nominal = parseInt(document.getElementById('nominal-modal').value) || 0;
  push(ref(db, 'toko_ikan_modal/'), { keterangan, nominal, tanggal: new Date().toLocaleString('id-ID') });
  tutupModalModal();
  document.getElementById('ket-modal').value = '';
  document.getElementById('nominal-modal').value = '';
}

function hapusCatatanModal(idFirebase) {
  if (confirm('Hapus catatan keuangan ini?')) remove(ref(db, `toko_ikan_modal/${idFirebase}`));
}

function bukaModalModal() { document.getElementById('modal-catat-modal').classList.remove('hidden'); }
function tutupModalModal() { document.getElementById('modal-catat-modal').classList.add('hidden'); }

// ==========================================
// 6. LOGIKA HALAMAN KASIR & KERANJANG
// ==========================================
function pilihKategoriKasir(kategori) {
  kategoriAktifKasir = kategori;
  ['semua', 'ikan', 'barang', 'mesin', 'aquarium'].forEach(kat => {
    const btn = document.getElementById('kasir-cat-' + kat);
    if(btn) {
      btn.className = kat === kategori 
        ? "px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow cursor-pointer shrink-0"
        : "px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer shrink-0";
    }
  });
  renderKasirProduk();
}

function setTipePenjualan(tipe) {
  tipePenjualan = tipe;
  const btnE = document.getElementById('btn-eceran');
  const btnG = document.getElementById('btn-grosir');
  const labelMode = document.getElementById('label-mode-harga');

  if (tipe === 'eceran') {
    if(btnE) btnE.className = "flex-1 py-1.5 rounded-lg font-semibold text-xs bg-indigo-600 text-white shadow cursor-pointer";
    if(btnG) btnG.className = "flex-1 py-1.5 rounded-lg font-semibold text-xs text-slate-600 cursor-pointer";
    if(labelMode) labelMode.innerText = "ECERAN";
  } else {
    if(btnG) btnG.className = "flex-1 py-1.5 rounded-lg font-semibold text-xs bg-indigo-600 text-white shadow cursor-pointer";
    if(btnE) btnE.className = "flex-1 py-1.5 rounded-lg font-semibold text-xs text-slate-600 cursor-pointer";
    if(labelMode) labelMode.innerText = "GROSIR";
  }
  
  keranjang.forEach(item => {
    const prod = dataStok.find(p => p.id === item.id);
    if (prod) item.harga = tipe === 'eceran' ? prod.hargaEceran : prod.hargaGrosir;
  });

  updateKeranjangUI();
  renderKasirProduk();
}

function renderKasirProduk() {
  const container = document.getElementById('produk-grid-kasir');
  const inputSearch = document.getElementById('input-pencarian-kasir');
  if (!container) return;

  const keyword = inputSearch ? inputSearch.value.toLowerCase().trim() : '';
  container.innerHTML = '';

  const filtered = dataStok.filter(item => {
    const matchKat = keyword !== '' ? true : (kategoriAktifKasir === 'semua' || item.kategori === kategoriAktifKasir);
    const matchSearch = item.nama.toLowerCase().includes(keyword);
    return matchKat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-xs col-span-full text-center py-10">Produk tidak ditemukan.</p>';
    return;
  }

  filtered.forEach(item => {
    const hargaAktif = tipePenjualan === 'eceran' ? item.hargaEceran : item.hargaGrosir;
    container.innerHTML += `
      <div class="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition relative group">
        <div>
          <div class="flex justify-between items-start mb-3">
            <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">${item.kategori}</span>
            <span class="text-[10px] text-slate-400 font-medium">Stok: ${item.stok}</span>
          </div>
          <h4 class="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition mb-1">${item.nama}</h4>
          ${item.kategori === 'aquarium' && item.ukuran ? `<p class="text-[10px] text-purple-600 font-semibold">${item.ukuran.p}x${item.ukuran.l}x${item.ukuran.t} cm</p>` : ''}
        </div>
        <div class="mt-4 flex justify-between items-end">
          <span class="text-indigo-600 font-bold text-sm">Rp ${hargaAktif.toLocaleString('id-ID')}</span>
          <button onclick="tambahKeKeranjang(${item.id})" class="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition shadow-sm cursor-pointer">+</button>
        </div>
      </div>
    `;
  });
}

function handleSearchEnter(e) {
  if (e.key === 'Enter') {
    renderKasirProduk();
    e.target.blur();
  }
}

function tambahKeKeranjang(id) {
  const produk = dataStok.find(p => p.id === id);
  if (!produk) return;

  if (produk.stok <= 0) {
    alert('Stok produk habis!');
    return;
  }

  const hargaAktif = tipePenjualan === 'eceran' ? produk.hargaEceran : produk.hargaGrosir;
  const itemExist = keranjang.find(k => k.id === id);

  if (itemExist) {
    if (itemExist.qty + 1 <= produk.stok) {
      itemExist.qty += 1;
    } else {
      alert('Stok tidak mencukupi!');
      return;
    }
  } else {
    keranjang.push({ 
      id: produk.id, 
      kategori: produk.kategori, 
      nama: produk.nama, 
      harga: hargaAktif, 
      qty: 1, 
      stokMax: produk.stok 
    });
  }

  updateKeranjangUI();
}

function updateQtyItem(index, val) {
  const qtyBaru = parseInt(val) || 1;
  const item = keranjang[index];
  if (qtyBaru > item.stokMax) {
    alert(`Stok maksimal hanya ${item.stokMax}`);
    item.qty = item.stokMax;
  } else if (qtyBaru < 1) {
    item.qty = 1;
  } else {
    item.qty = qtyBaru;
  }
  updateKeranjangUI();
}

function updateHargaItem(index, val) {
  const hargaBaru = parseInt(val) || 0;
  keranjang[index].harga = hargaBaru;
  updateKeranjangUI();
}

function hapusItemKeranjang(index) {
  keranjang.splice(index, 1);
  updateKeranjangUI();
}

function kosongkanKeranjang() {
  keranjang = [];
  updateKeranjangUI();
}

function updateKeranjangUI() {
  const container = document.getElementById('keranjang-list');
  const totalEl = document.getElementById('total-harga');
  if (!container) return;

  container.innerHTML = '';
  let total = 0;

  if (keranjang.length === 0) {
    container.innerHTML = '<p class="text-slate-400 text-center py-6">Keranjang masih kosong</p>';
    if(totalEl) totalEl.innerText = "Rp 0";
    hitungKembalian();
    return;
  }

  keranjang.forEach((item, index) => {
    const subtotal = item.harga * item.qty;
    total += subtotal;
    const katLabel = item.kategori ? item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1) : 'Produk';
    const badgeColor = item.kategori === 'aquarium' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600';

    container.innerHTML += `
      <div class="pt-3 first:pt-0 pb-3 space-y-2">
        <div class="flex justify-between items-center gap-2">
          <div class="flex items-center gap-2">
            <span class="${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">${katLabel}</span>
            <span class="font-bold text-slate-800 text-xs leading-snug">${item.nama}</span>
          </div>
          <button onclick="hapusItemKeranjang(${index})" class="text-rose-500 hover:text-rose-700 font-semibold text-xs cursor-pointer shrink-0">Hapus</button>
        </div>
        
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            <span class="text-[11px] text-slate-500">Qty:</span>
            <input type="number" min="1" value="${item.qty}" onchange="updateQtyItem(${index}, this.value)" class="w-14 bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-center text-slate-800 text-xs focus:outline-none focus:border-indigo-600">
          </div>
          <div class="flex items-center gap-1">
            <span class="text-[11px] text-slate-500">Harga:</span>
            <input type="number" value="${item.harga}" onchange="updateHargaItem(${index}, this.value)" class="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-center text-indigo-600 text-xs focus:outline-none focus:border-indigo-600">
          </div>
        </div>

        <div class="text-right">
          <span class="font-bold text-slate-900 text-xs">Rp ${subtotal.toLocaleString('id-ID')}</span>
        </div>
      </div>
    `;
  });

  if(totalEl) totalEl.innerText = "Rp " + total.toLocaleString('id-ID');
  hitungKembalian();
}

function hitungKembalian() {
  const total = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  const uangTunaiInput = document.getElementById('uang-tunai');
  const labelKembalian = document.getElementById('label-kembalian');
  if (!uangTunaiInput || !labelKembalian) return;

  if (uangTunaiInput.value.trim() === "") {
    labelKembalian.innerText = "Rp 0";
    labelKembalian.className = "font-bold text-slate-600 text-sm";
    return;
  }

  const uangTunai = parseFloat(uangTunaiInput.value) || 0;
  const selisih = uangTunai - total;

  if (selisih >= 0) {
    labelKembalian.innerText = "Rp " + selisih.toLocaleString('id-ID');
    labelKembalian.className = "font-bold text-emerald-600 text-sm";
  } else {
    labelKembalian.innerText = "Kurang Rp " + Math.abs(selisih).toLocaleString('id-ID');
    labelKembalian.className = "font-bold text-rose-600 text-sm";
  }
}

function prosesBayar() {
  if (keranjang.length === 0) { alert('Keranjang masih kosong!'); return; }

  const total = keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
  const uangTunaiInput = document.getElementById('uang-tunai').value.trim();
  const uangTunai = uangTunaiInput === "" ? total : parseFloat(uangTunaiInput) || 0;

  if (uangTunai < total) {
    alert('Uang tunai kurang dari total tagihan!');
    return;
  }
  
  keranjang.forEach(kItem => {
    const p = dataStok.find(item => item.id === kItem.id);
    if (p) p.stok -= kItem.qty;
  });
  simpanStorage();
  
  const namaPelanggan = document.getElementById('nama-pelanggan').value || 'Umum';
  const notaBaru = { 
    idNota: "N99-" + Date.now().toString().slice(-5), 
    tanggal: new Date().toLocaleString('id-ID'), 
    namaPelanggan: namaPelanggan,
    items: [...keranjang], 
    total: total,
    uangTunai: uangTunai,
    kembalian: uangTunai - total,
    tipeHarga: tipePenjualan
  };

  push(ref(db, 'toko_ikan_riwayat/'), notaBaru);
  cetakNota(notaBaru);
  
  keranjang = [];
  document.getElementById('uang-tunai').value = '';
  document.getElementById('nama-pelanggan').value = 'Umum';
  updateKeranjangUI();
  renderKasirProduk();
  renderDashboardStats();
}

function cetakNota(nota) {
  const tEl = document.getElementById('nota-tanggal');
  const idEl = document.getElementById('nota-id');
  const pembeliEl = document.getElementById('nota-pelanggan');
  const tipeHargaEl = document.getElementById('nota-tipe-harga');
  const totEl = document.getElementById('nota-total');
  const uangTunaiEl = document.getElementById('nota-uang-tunai');
  const kembalianEl = document.getElementById('nota-kembalian');

  if(tEl) tEl.innerText = "Tanggal: " + nota.tanggal;
  if(idEl) idEl.innerText = "No. Invoice: " + nota.idNota;
  if(pembeliEl) pembeliEl.innerText = nota.namaPelanggan;
  if(tipeHargaEl) tipeHargaEl.innerText = (nota.tipeHarga || 'eceran').toUpperCase();
  if(totEl) totEl.innerText = "Rp " + nota.total.toLocaleString('id-ID');
  if(uangTunaiEl) uangTunaiEl.innerText = "Rp " + (nota.uangTunai || nota.total).toLocaleString('id-ID');
  if(kembalianEl) kembalianEl.innerText = "Rp " + (nota.kembalian || 0).toLocaleString('id-ID');
  
  const itemsContainer = document.getElementById('nota-items');
  if(itemsContainer) {
    itemsContainer.innerHTML = '';
    nota.items.forEach((item, index) => {
      itemsContainer.innerHTML += `
        <tr class="border-b border-slate-100">
          <td class="p-3 text-center text-slate-400 font-medium">${index + 1}</td>
          <td class="p-3 font-bold text-slate-800">${item.nama}</td>
          <td class="p-3 text-center font-bold text-slate-700">${item.qty}</td>
          <td class="p-3 text-right text-slate-600">Rp ${item.harga.toLocaleString('id-ID')}</td>
          <td class="p-3 text-right font-bold text-slate-900">Rp ${(item.harga * item.qty).toLocaleString('id-ID')}</td>
        </tr>
      `;
    });
  }
  
  const receipt = document.getElementById('printable-receipt');
  if(receipt) {
    receipt.classList.remove('hidden');
  }
}

function tutupNota() {
  const receipt = document.getElementById('printable-receipt');
  if(receipt) {
    receipt.classList.add('hidden');
  }
}

function lihatNotaRiwayat(idFirebase) {
  const trx = dataRiwayat.find(t => t.idFirebase === idFirebase);
  if (trx) {
    cetakNota(trx);
  } else {
    alert('Data nota tidak ditemukan.');
  }
}

// ==========================================
// 7. MANAJEMEN STOK & KALKULATOR AQUARIUM
// ==========================================
function hitungHargaAquarium() {
  const p = parseFloat(document.getElementById('aq-p').value) || 0;
  const l = parseFloat(document.getElementById('aq-l').value) || 0;
  const t = parseFloat(document.getElementById('aq-t').value) || 0;

  const modal = ((p * l) / 900 * 8000) + ((p * t) / 900 * 8000 * 2) + ((l * t) / 900 * 8000 * 2);
  const modalBulat = Math.round(modal);

  const grosir = Math.round(modalBulat * 2.4);
  const eceran = Math.round(modalBulat * 3.1);

  if(document.getElementById('aq-harga-eceran')) document.getElementById('aq-harga-eceran').value = eceran > 0 ? eceran : 0;
  if(document.getElementById('aq-harga-grosir')) document.getElementById('aq-harga-grosir').value = grosir > 0 ? grosir : 0;

  const previewEl = document.getElementById('preview-harga-aq');
  if(previewEl) {
    previewEl.innerHTML = `Modal: Rp ${modalBulat.toLocaleString('id-ID')} | <span class="text-indigo-600 font-bold">Grosir: Rp ${grosir.toLocaleString('id-ID')}</span> | <span class="text-emerald-600 font-bold">Ecer: Rp ${eceran.toLocaleString('id-ID')}</span>`;
  }
}

function renderTabelAdmin() {
  const container = document.getElementById('tabel-stok-admin');
  const inputSearch = document.getElementById('admin-input-pencarian');
  if (!container) return;

  const keyword = inputSearch ? inputSearch.value.toLowerCase() : '';
  container.innerHTML = '';

  const filtered = dataStok.filter(item => {
    const matchKat = item.kategori === kategoriAktifAdmin;
    const matchSearch = item.nama.toLowerCase().includes(keyword);
    return matchKat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-slate-400 text-center py-6">Data tidak ditemukan.</td></tr>';
    return;
  }

  filtered.forEach((item) => {
    const originalIndex = dataStok.indexOf(item);
    const labelKat = item.kategori === 'aquarium' ? `📐 Aquarium (${item.ukuran.p}x${item.ukuran.l}x${item.ukuran.t} cm)` : item.kategori.toUpperCase();
    
    container.innerHTML += `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td class="p-3 font-bold text-slate-800">${item.nama}</td>
        <td class="p-3"><span class="bg-slate-100 text-slate-600 px-2.5 py-1 rounded uppercase text-[10px] font-bold">${labelKat}</span></td>
        <td class="p-3">Rp ${item.hargaEceran.toLocaleString('id-ID')}</td>
        <td class="p-3">Rp ${item.hargaGrosir.toLocaleString('id-ID')}</td>
        <td class="p-3"><span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">${item.stok}</span></td>
        <td class="p-3 text-center space-x-2">
          <button onclick="editProduk(${originalIndex})" class="bg-amber-50 text-amber-600 hover:bg-amber-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer">Edit</button>
          <button onclick="hapusProduk(${item.id})" class="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer">Hapus</button>
        </td>
      </tr>
    `;
  });
}

function simpanProdukAdmin(e) {
  e.preventDefault();
  const editIndex = document.getElementById('edit-index').value;
  const nama = document.getElementById('nama-produk').value;
  const stok = parseInt(document.getElementById('stok-produk').value) || 0;

  let kategori = kategoriAktifAdmin;
  let hargaEceran = 0;
  let hargaGrosir = 0;
  let ukuran = null;

  if (kategori === 'aquarium') {
    const p = parseFloat(document.getElementById('aq-p').value) || 0;
    const l = parseFloat(document.getElementById('aq-l').value) || 0;
    const t = parseFloat(document.getElementById('aq-t').value) || 0;
    hargaEceran = parseInt(document.getElementById('aq-harga-eceran').value) || 0;
    hargaGrosir = parseInt(document.getElementById('aq-harga-grosir').value) || 0;
    ukuran = { p, l, t };
  } else {
    hargaEceran = parseInt(document.getElementById('harga-eceran').value) || 0;
    hargaGrosir = parseInt(document.getElementById('harga-grosir').value) || 0;
  }

  if (editIndex === "") {
    dataStok.push({ id: Date.now(), kategori, nama, hargaEceran, hargaGrosir, stok, ukuran });
    alert('Produk berhasil ditambahkan!');
  } else {
    const idx = parseInt(editIndex);
    dataStok[idx].kategori = kategori;
    dataStok[idx].nama = nama;
    dataStok[idx].hargaEceran = hargaEceran;
    dataStok[idx].hargaGrosir = hargaGrosir;
    dataStok[idx].stok = stok;
    dataStok[idx].ukuran = ukuran;
    alert('Produk berhasil diperbarui!');
  }

  simpanStorage();
  renderTabelAdmin();
  resetFormAdmin();
  renderDashboardStats();
}

function editProduk(index) {
  const item = dataStok[index];
  document.getElementById('edit-index').value = index;
  document.getElementById('nama-produk').value = item.nama;
  document.getElementById('stok-produk').value = item.stok;

  pilihMenu(item.kategori);

  if (item.kategori === 'aquarium' && item.ukuran) {
    document.getElementById('aq-p').value = item.ukuran.p;
    document.getElementById('aq-l').value = item.ukuran.l;
    document.getElementById('aq-t').value = item.ukuran.t;
    hitungHargaAquarium();
  } else {
    document.getElementById('harga-eceran').value = item.hargaEceran;
    document.getElementById('harga-grosir').value = item.hargaGrosir;
  }

  document.getElementById('form-title').innerText = "Edit Data Produk";
  document.getElementById('btn-submit-form').innerText = "Update Produk";
  document.getElementById('btn-cancel-edit').classList.remove('hidden');
}

function resetFormAdmin() {
  const form = document.getElementById('form-tambah-produk');
  if(form) form.reset();
  const editIdx = document.getElementById('edit-index');
  if(editIdx) editIdx.value = "";
  const formTitle = document.getElementById('form-title');
  if(formTitle) formTitle.innerText = "Tambah Produk Baru";
  const btnSubmit = document.getElementById('btn-submit-form');
  if(btnSubmit) btnSubmit.innerText = "Simpan Produk";
  const btnCancel = document.getElementById('btn-cancel-edit');
  if(btnCancel) btnCancel.classList.add('hidden');
}

function hapusProduk(id) {
  if (confirm('Yakin ingin menghapus produk ini?')) {
    dataStok = dataStok.filter(item => item.id !== id);
    simpanStorage();
    renderTabelAdmin();
    renderDashboardStats();
  }
}

// ==========================================
// 8. RIWAYAT TRANSAKSI
// ==========================================
function renderTabelRiwayat() {
  const container = document.getElementById('tabel-riwayat-admin');
  const inputSearch = document.getElementById('riwayat-input-pencarian');
  if (!container) return;

  const keyword = inputSearch ? inputSearch.value.toLowerCase() : '';
  container.innerHTML = '';

  const filtered = dataRiwayat.filter(trx => trx.idNota.toLowerCase().includes(keyword) || trx.tanggal.toLowerCase().includes(keyword) || (trx.namaPelanggan && trx.namaPelanggan.toLowerCase().includes(keyword)));

  if (filtered.length === 0) {
    container.innerHTML = '<tr><td colspan="5" class="text-slate-400 text-center py-6">Belum ada riwayat transaksi.</td></tr>';
    return;
  }

  filtered.slice().reverse().forEach((trx) => {
    let rincianHtml = '<ul class="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">';
    trx.items.forEach(i => {
      rincianHtml += `<li>${i.nama} (${i.qty}x @ Rp ${i.harga.toLocaleString('id-ID')})</li>`;
    });
    rincianHtml += '</ul>';

    container.innerHTML += `
      <tr class="border-b border-slate-100 hover:bg-slate-50 align-top">
        <td class="p-3">
          <span class="font-bold text-indigo-600 block">${trx.idNota}</span>
          <span class="text-[10px] text-slate-500">Pembeli: <b>${trx.namaPelanggan || 'Umum'}</b></span>
        </td>
        <td class="p-3 text-slate-500">${trx.tanggal}</td>
        <td class="p-3">${rincianHtml}</td>
        <td class="p-3 font-bold text-slate-800">Rp ${trx.total.toLocaleString('id-ID')}</td>
        <td class="p-3 text-center space-x-1">
          <button onclick="lihatNotaRiwayat('${trx.idFirebase}')" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer">Lihat Nota</button>
          <button onclick="hapusRiwayat('${trx.idFirebase}')" class="bg-red-50 text-red-600 hover:bg-red-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer">Hapus</button>
        </td>
      </tr>
    `;
  });
}

function hapusRiwayat(idFirebase) {
  if (confirm('Yakin ingin menghapus riwayat transaksi ini?')) {
    remove(ref(db, `toko_ikan_riwayat/${idFirebase}`));
  }
}

// ==========================================
// 9. DAFTARKAN FUNGSI KE GLOBAL (WINDOW)
// ==========================================
window.pilihMenu = pilihMenu;
window.bukaModalModal = bukaModalModal;
window.tutupModalModal = tutupModalModal;
window.simpanCatatanModal = simpanCatatanModal;
window.hapusCatatanModal = hapusCatatanModal;
window.pilihKategoriKasir = pilihKategoriKasir;
window.setTipePenjualan = setTipePenjualan;
window.tambahKeKeranjang = tambahKeKeranjang;
window.updateQtyItem = updateQtyItem;
window.updateHargaItem = updateHargaItem;
window.hapusItemKeranjang = hapusItemKeranjang;
window.kosongkanKeranjang = kosongkanKeranjang;
window.hitungKembalian = hitungKembalian;
window.prosesBayar = prosesBayar;
window.tutupNota = tutupNota;
window.lihatNotaRiwayat = lihatNotaRiwayat;
window.handleSearchEnter = handleSearchEnter;
window.hitungHargaAquarium = hitungHargaAquarium;
window.renderTabelAdmin = renderTabelAdmin;
window.simpanProdukAdmin = simpanProdukAdmin;
window.editProduk = editProduk;
window.resetFormAdmin = resetFormAdmin;
window.hapusProduk = hapusProduk;
window.renderTabelRiwayat = renderTabelRiwayat;
window.hapusRiwayat = hapusRiwayat;
window.logout = logout;
window.checkAuth = checkAuth;