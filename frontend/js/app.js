var INR = '\u20B9';
var _products = [];
var _customers = [];

function $(id) { return document.getElementById(id); }

function go(page, el) {
    document.querySelectorAll('[id^="p-"]').forEach(function(p) { p.classList.add('hidden'); });
    document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('bg-indigo-700'); });
    $('p-' + page).classList.remove('hidden');
    if (el) el.classList.add('bg-indigo-700');
    var t = {dashboard:'Dashboard',products:'Products',orders:'Orders',customers:'Customers',transporters:'Transporters',sales:'Sales',expenses:'Expenses',reports:'Reports'};
    $('pg-title').textContent = t[page] || page;
    if (page === 'dashboard') loadDashboard();
    if (page === 'products') loadProducts();
    if (page === 'orders') loadOrders();
    if (page === 'customers') loadCustomers();
    if (page === 'transporters') loadTransporters();
    if (page === 'sales') loadSales();
    if (page === 'expenses') loadExpenses();
    if (page === 'reports') loadReport();
}

async function api(url, opts) {
    opts = opts || {};
    var h = {'Content-Type': 'application/json'};
    if (opts.headers) Object.assign(h, opts.headers);
    var r = await fetch(url, {method: opts.method || 'GET', headers: h, body: opts.body ? opts.body : undefined});
    if (!r.ok) { var e = await r.text(); throw new Error(e); }
    return r.json();
}

function toast(msg, err) {
    $('toast').textContent = msg;
    $('toast').className = 'fixed bottom-4 right-4 text-white px-6 py-3 rounded-lg shadow-lg ' + (err ? 'bg-red-600' : 'bg-green-600');
    $('toast').classList.remove('hidden');
    setTimeout(function() { $('toast').classList.add('hidden'); }, 3000);
}

async function showModal(id) {
    $(id).classList.remove('hidden');
    if (id === 'm-sale') {
        await refreshDropdowns();
    }
}

async function refreshDropdowns() {
    _products = await api('/api/products');
    _customers = await api('/api/customers');
    var po = '';
    _products.forEach(function(p) { po += '<option value="' + p.id + '">' + p.part_no + ' - ' + p.name + ' (' + (p.size || 'N/A') + ')</option>'; });
    var co = '';
    _customers.forEach(function(c) { co += '<option value="' + c.id + '">' + c.customer_id + ' - ' + c.contact_name + '</option>'; });
    if ($('f-slprod')) $('f-slprod').innerHTML = po;
    if ($('f-slcust')) $('f-slcust').innerHTML = co;
}
function hideModal(id) { $(id).classList.add('hidden'); }

function fmt(n) { return INR + Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0}); }

async function loadProducts() {
    _products = await api('/api/products');
    var h = '';
    _products.forEach(function(p) {
        h += '<tr class="border-b hover:bg-gray-50">';
        h += '<td class="px-3 py-2">' + p.id + '</td>';
        h += '<td class="px-3 py-2">' + (p.part_no || '-') + '</td>';
        h += '<td class="px-3 py-2 font-medium">' + p.name + '</td>';
        h += '<td class="px-3 py-2">' + (p.category || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (p.size || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (p.load_rating || '-') + '</td>';
        h += '<td class="px-3 py-2">' + fmt(p.mrp) + '</td>';
        h += '<td class="px-3 py-2">';
        h += '<button onclick="editProduct(' + p.id + ')" class="text-blue-600 hover:text-blue-800 mr-2" title="Edit"><i class="fas fa-pen"></i></button>';
        h += '<button onclick="openPricing(' + p.id + ')" class="text-orange-600 hover:text-orange-800 mr-2" title="Pricing"><i class="fas fa-tag"></i></button>';
        h += '<button onclick="deleteProduct(' + p.id + ')" class="text-red-600 hover:text-red-800" title="Delete"><i class="fas fa-trash"></i></button>';
        h += '</td></tr>';
    });
    $('t-products').innerHTML = h || '<tr><td colspan="8" class="text-center py-4 text-gray-400">No products</td></tr>';
}

function editProduct(id) {
    var p = _products.find(function(x) { return x.id === id; });
    if (!p) return;
    $('f-pid').value = p.id;
    $('f-ppartno').value = p.part_no || '';
    $('f-pname').value = p.name;
    $('f-pcat').value = p.category || '';
    $('f-psize').value = p.size || '';
    $('f-pload').value = p.load_rating || '';
    $('f-phsn').value = p.hsn_code || '';
    $('m-product-title').textContent = 'Edit Product';
    showModal('m-product');
}

async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await api('/api/products/' + id, {method: 'DELETE'});
    toast('Product deleted');
    loadProducts();
}

async function openPricing(id) {
    $('f-prpid').value = id;
    try {
        var pr = await api('/api/products/' + id + '/pricing');
        $('f-praw').value = pr.raw_material_cost || 0;
        $('f-pmrp').value = pr.mrp || 0;
        $('f-pgst').value = pr.gst_rate || 18;
    } catch(e) {}
    showModal('m-pricing');
}

async function loadOrders() {
    var orders = await api('/api/orders');
    var h = '';
    orders.forEach(function(o) {
        h += '<tr class="border-b hover:bg-gray-50">';
        h += '<td class="px-2 py-2">' + (o.sl_no || '') + '</td>';
        h += '<td class="px-2 py-2">' + (o.po_no || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.po_date || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.billing_site || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.shipping_site || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.no_of_boxes || 0) + '</td>';
        h += '<td class="px-2 py-2">' + fmt(o.value_excl_gst_freight) + '</td>';
        h += '<td class="px-2 py-2">' + (o.invoice_no || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.invoice_date || '-') + '</td>';
        h += '<td class="px-2 py-2">' + fmt(o.invoice_amount_excl_gst) + '</td>';
        h += '<td class="px-2 py-2">' + (o.weight_kgs || 0) + '</td>';
        h += '<td class="px-2 py-2">' + (o.freight_rate_per_kg || 0) + '</td>';
        h += '<td class="px-2 py-2">' + fmt(o.transport_charges) + '</td>';
        h += '<td class="px-2 py-2 font-bold">' + fmt(o.invoice_amount) + '</td>';
        h += '<td class="px-2 py-2">' + (o.eway_bill_no || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.lr_no || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.entry_date || '-') + '</td>';
        h += '<td class="px-2 py-2">' + fmt(o.credit_note_amount) + '</td>';
        h += '<td class="px-2 py-2">' + (o.credit_note_no || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.transporter || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (o.transporter_no || '-') + '</td>';
        h += '<td class="px-2 py-2">';
        h += '<button onclick="editOrder(' + o.id + ')" class="text-blue-600 hover:text-blue-800 mr-2" title="Edit"><i class="fas fa-pen"></i></button>';
        h += '<button onclick="deleteOrder(' + o.id + ')" class="text-red-600 hover:text-red-800" title="Delete"><i class="fas fa-trash"></i></button>';
        h += '</td></tr>';
    });
    $('t-orders').innerHTML = h || '<tr><td colspan="22" class="text-center py-4 text-gray-400">No orders</td></tr>';
}

function editOrder(id) {
    var orders = [];
    api('/api/orders').then(function(data) {
        orders = data;
        var o = orders.find(function(x) { return x.id === id; });
        if (!o) return;
        $('f-oid').value = o.id;
        $('f-oslno').value = o.sl_no || '';
        $('f-opo').value = o.po_no || '';
        $('f-opodate').value = o.po_date || '';
        $('f-obilling').value = o.billing_site || '';
        $('f-oshipping').value = o.shipping_site || '';
        $('f-oboxes').value = o.no_of_boxes || '';
        $('f-ovalue').value = o.value_excl_gst_freight || '';
        $('f-oinvno').value = o.invoice_no || '';
        $('f-oinvdate').value = o.invoice_date || '';
        $('f-oinvamt').value = o.invoice_amount_excl_gst || '';
        $('f-oweight').value = o.weight_kgs || '';
        $('f-ofrate').value = o.freight_rate_per_kg || '';
        $('f-otcharges').value = o.transport_charges || '';
        $('f-oiamt').value = o.invoice_amount || '';
        $('f-oeway').value = o.eway_bill_no || '';
        $('f-olr').value = o.lr_no || '';
        $('f-oentrydate').value = o.entry_date || '';
        $('f-ocnamt').value = o.credit_note_amount || '';
        $('f-ocnno').value = o.credit_note_no || '';
        $('f-otransporter').value = o.transporter || '';
        $('f-otransno').value = o.transporter_no || '';
        $('m-order-title').textContent = 'Edit Order';
        showModal('m-order');
    });
}

async function deleteOrder(id) {
    if (!confirm('Delete this order?')) return;
    await api('/api/orders/' + id, {method: 'DELETE'});
    toast('Order deleted');
    loadOrders();
}

async function loadCustomers() {
    _customers = await api('/api/customers');
    var h = '';
    _customers.forEach(function(c) {
        h += '<tr class="border-b hover:bg-gray-50">';
        h += '<td class="px-2 py-2 font-medium">' + (c.customer_id || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.gstin || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.state || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.district || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.city || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.contact_name || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.contact_number || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (c.exec_name || '-') + '</td>';
        h += '<td class="px-2 py-2"><span class="px-2 py-1 rounded text-xs ' + (c.blacklisted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') + '">' + (c.blacklisted ? 'Blacklisted' : 'Active') + '</span></td>';
        h += '<td class="px-2 py-2">';
        h += '<button onclick="editCustomer(' + c.id + ')" class="text-blue-600 hover:text-blue-800" title="Edit"><i class="fas fa-pen"></i></button>';
        h += '</td></tr>';
    });
    $('t-customers').innerHTML = h || '<tr><td colspan="10" class="text-center py-4 text-gray-400">No customers</td></tr>';
}

var _transporters = [];
async function loadTransporters() {
    _transporters = await api('/api/transporters');
    var h = '';
    _transporters.forEach(function(t) {
        h += '<tr class="border-b hover:bg-gray-50">';
        h += '<td class="px-2 py-2 font-medium">' + (t.transporter_id || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (t.name || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (t.phone || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (t.state || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (t.gst_number || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (t.pan_number || '-') + '</td>';
        h += '<td class="px-2 py-2">' + (t.contact_person || '-') + '</td>';
        h += '<td class="px-2 py-2"><span class="px-2 py-1 rounded text-xs ' + (t.blacklisted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700') + '">' + (t.blacklisted ? 'Blacklisted' : 'Active') + '</span></td>';
        h += '<td class="px-2 py-2">';
        h += '<button onclick="editTransporter(' + t.id + ')" class="text-blue-600 hover:text-blue-800 mr-2" title="Edit"><i class="fas fa-pen"></i></button>';
        h += '<button onclick="deleteTransporter(' + t.id + ')" class="text-red-600 hover:text-red-800" title="Delete"><i class="fas fa-trash"></i></button>';
        h += '</td></tr>';
    });
    $('t-transporters').innerHTML = h || '<tr><td colspan="9" class="text-center py-4 text-gray-400">No transporters</td></tr>';
}

function editTransporter(id) {
    var t = _transporters.find(function(x) { return x.id === id; });
    if (!t) return;
    $('f-tid').value = t.id;
    $('f-ttransid').value = t.transporter_id || '';
    $('f-tname').value = t.name || '';
    $('f-tphone').value = t.phone || '';
    $('f-temail').value = t.email || '';
    $('f-taddr').value = t.address || '';
    $('f-tstate').value = t.state || '';
    $('f-tdistrict').value = t.district || '';
    $('f-tcity').value = t.city || '';
    $('f-tpincode').value = t.pincode || '';
    $('f-tgst').value = t.gst_number || '';
    $('f-tpan').value = t.pan_number || '';
    $('f-tcontactperson').value = t.contact_person || '';
    $('f-tcontactnum').value = t.contact_number || '';
    $('f-tblacklisted').checked = t.blacklisted === 1;
    $('f-tgstfile-name').innerHTML = t.gst_certificate ? '<a href="/api/view-file?url=' + encodeURIComponent(t.gst_certificate) + '" target="_blank" class="text-blue-600 underline">View uploaded file</a>' : '';
    $('f-tpanfile-name').innerHTML = t.pan_card ? '<a href="/api/view-file?url=' + encodeURIComponent(t.pan_card) + '" target="_blank" class="text-blue-600 underline">View uploaded file</a>' : '';
    $('m-trans-title').textContent = 'Edit Transporter';
    showModal('m-transporter');
}

async function deleteTransporter(id) {
    if (!confirm('Delete this transporter?')) return;
    await api('/api/transporters/' + id, {method: 'DELETE'});
    toast('Transporter deleted');
    loadTransporters();
}

function editCustomer(id) {
    var c = _customers.find(function(x) { return x.id === id; });
    if (!c) return;
    $('f-cid').value = c.id;
    $('f-ccustid').value = c.customer_id || '';
    $('f-cgstin').value = c.gstin || '';
    $('f-cbilladdr').value = c.billing_address || '';
    $('f-cshipaddr').value = c.shipping_address || '';
    $('f-cstate').value = c.state || '';
    $('f-cdistrict').value = c.district || '';
    $('f-ccity').value = c.city || '';
    $('f-cpincode').value = c.pincode || '';
    $('f-ccontactname').value = c.contact_name || '';
    $('f-ccontactnum').value = c.contact_number || '';
    $('f-ccontactemail').value = c.contact_email || '';
    $('f-cexeccode').value = c.exec_code || '';
    $('f-cexecname').value = c.exec_name || '';
    $('f-cexecnum').value = c.exec_number || '';
    $('f-cexecemail').value = c.exec_email || '';
    $('f-cblacklisted').checked = c.blacklisted === 1;
    $('m-cust-title').textContent = 'Edit Customer';
    showModal('m-customer');
}

$('f-csameaddr').addEventListener('change', function() {
    if (this.checked) {
        $('f-cshipaddr').value = $('f-cbilladdr').value;
    }
});

async function loadSales() {
    try {
    var sales = await api('/api/sales');
    var h = '';
    sales.forEach(function(s) {
        h += '<tr class="border-b hover:bg-gray-50">';
        h += '<td class="px-3 py-2 font-medium">' + (s.invoice_no || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (s.sale_date ? s.sale_date.substring(0, 10) : '-') + '</td>';
        h += '<td class="px-3 py-2">' + (s.party_name || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (s.location || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (s.transporter_name || '-') + '</td>';
        h += '<td class="px-3 py-2">' + fmt(s.freight_amount) + '</td>';
        h += '<td class="px-3 py-2">' + (s.weight_kgs || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (s.gp_percent ? Number(s.gp_percent).toFixed(1) + '%' : '-') + '</td>';
        h += '<td class="px-3 py-2"><button onclick="deleteSale(' + s.id + ')" class="text-red-600 hover:text-red-800" title="Delete"><i class="fas fa-trash"></i></button></td>';
        h += '</tr>';
    });
    $('t-sales').innerHTML = h || '<tr><td colspan="9" class="text-center py-4 text-gray-400">No sales</td></tr>';
    } catch(e) { console.error('loadSales error:', e); toast('Error loading sales: ' + e.message, true); }
}

async function deleteSale(id) {
    if (!confirm('Delete this sale?')) return;
    await api('/api/sales/' + id, {method: 'DELETE'});
    toast('Sale deleted');
    loadSales();
}

function calcSale() {
    var qty = parseFloat($('f-slqty').value) || 0;
    var price = parseFloat($('f-slprice').value) || 0;
    var disc = parseFloat($('f-sldisc').value) || 0;
    var frt = parseFloat($('f-slfrt').value) || 0;
    var taxable = qty * price;
    var discAmt = taxable * disc / 100;
    taxable -= discAmt;
    var cgst = taxable * 0.09;
    var sgst = taxable * 0.09;
    var total = taxable + cgst + sgst + frt;
    $('sv-tax').textContent = fmt(taxable);
    $('sv-cgst').textContent = fmt(cgst);
    $('sv-sgst').textContent = fmt(sgst);
    $('sv-frt').textContent = fmt(frt);
    $('sv-total').textContent = fmt(total);
}

async function loadExpenses() {
    var expenses = await api('/api/expenses');
    var h = '';
    expenses.forEach(function(e) {
        h += '<tr class="border-b hover:bg-gray-50">';
        h += '<td class="px-3 py-2">' + (e.expense_date ? e.expense_date.substring(0, 10) : '-') + '</td>';
        h += '<td class="px-3 py-2"><span class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">' + e.category + '</span></td>';
        h += '<td class="px-3 py-2">' + (e.description || '-') + '</td>';
        h += '<td class="px-3 py-2">' + (e.vendor || '-') + '</td>';
        h += '<td class="px-3 py-2 font-bold text-red-600">' + fmt(e.amount) + '</td>';
        h += '<td class="px-3 py-2"><button onclick="deleteExpense(' + e.id + ')" class="text-red-600 hover:text-red-800" title="Delete"><i class="fas fa-trash"></i></button></td>';
        h += '</tr>';
    });
    $('t-expenses').innerHTML = h || '<tr><td colspan="6" class="text-center py-4 text-gray-400">No expenses</td></tr>';
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    await api('/api/expenses/' + id, {method: 'DELETE'});
    toast('Expense deleted');
    loadExpenses();
}

async function loadDashboard() {
    try {
    var d = await api('/api/dashboard');
    var html = '';
    html += '<div class="bg-white rounded-xl shadow p-4 border-l-4 border-indigo-500"><p class="text-gray-500 text-sm">Products</p><p class="text-2xl font-bold">' + d.total_products + '</p></div>';
    html += '<div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500"><p class="text-gray-500 text-sm">Customers</p><p class="text-2xl font-bold">' + d.total_customers + '</p></div>';
    html += '<div class="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500"><p class="text-gray-500 text-sm">Orders</p><p class="text-2xl font-bold">' + d.total_orders + '</p><p class="text-xs text-gray-400">' + fmt(d.total_order_value) + ' value</p></div>';
    html += '<div class="bg-white rounded-xl shadow p-4 border-l-4 border-green-500"><p class="text-gray-500 text-sm">Revenue</p><p class="text-2xl font-bold">' + fmt(d.revenue) + '</p><p class="text-xs text-gray-400">' + d.total_sales + ' sales</p></div>';
    html += '<div class="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500"><p class="text-gray-500 text-sm">Freight</p><p class="text-2xl font-bold">' + fmt(d.freight) + '</p></div>';
    html += '<div class="bg-white rounded-xl shadow p-4 border-l-4 border-red-500"><p class="text-gray-500 text-sm">Pending</p><p class="text-2xl font-bold text-red-600">' + fmt(d.pending) + '</p></div>';
    $('dash-cards').innerHTML = html;

    var oh = '';
    if (d.recent_orders && d.recent_orders.length) {
        d.recent_orders.forEach(function(o) {
            oh += '<div class="flex justify-between items-center p-2 border-b">';
            oh += '<div><p class="font-medium text-sm">' + (o.po_no || 'Order #' + o.sl_no) + '</p>';
            oh += '<p class="text-xs text-gray-400">' + (o.billing_site || '') + (o.entry_date ? ' - ' + o.entry_date : '') + '</p></div>';
            oh += '<div class="text-right"><p class="font-bold text-sm">' + fmt(o.invoice_amount) + '</p>';
            oh += '<p class="text-xs text-gray-400">' + (o.invoice_no || '-') + '</p></div></div>';
        });
    } else {
        oh = '<p class="text-gray-400 text-sm">No orders yet</p>';
    }
    $('dash-orders').innerHTML = oh;

    var rh = '';
    if (d.recent_sales && d.recent_sales.length) {
        d.recent_sales.forEach(function(s) {
            rh += '<div class="flex justify-between items-center p-2 border-b">';
            rh += '<div><p class="font-medium text-sm">' + (s.customer || 'Unknown') + '</p>';
            rh += '<p class="text-xs text-gray-400">' + (s.invoice || '') + (s.date ? ' - ' + s.date : '') + '</p></div>';
            rh += '<div class="text-right"><p class="font-bold text-sm">' + fmt(s.amount) + '</p>';
            rh += '<span class="text-xs ' + (s.status === 'Paid' ? 'text-green-600' : 'text-orange-600') + '">' + (s.status || '') + '</span></div></div>';
        });
    } else {
        rh = '<p class="text-gray-400 text-sm">No sales yet</p>';
    }
    $('dash-recent').innerHTML = rh;
    } catch(e) { console.error('Dashboard error:', e); }
}

async function loadReport() {
    try {
    var from = $('rpt-from') ? $('rpt-from').value : '';
    var to = $('rpt-to') ? $('rpt-to').value : '';
    var params = [];
    if (from) params.push('start_date=' + from);
    if (to) params.push('end_date=' + to);
    var url = '/api/reports/profit-loss' + (params.length ? '?' + params.join('&') : '');
    var d = await api(url);
    var h = '';

    h += '<div class="grid grid-cols-4 gap-4 mb-6">';
    h += '<div class="bg-indigo-50 rounded-lg p-4 border border-indigo-200"><p class="text-sm text-indigo-600 font-medium">Orders</p><p class="text-2xl font-bold">' + d.total_orders + '</p><p class="text-xs text-gray-500">' + fmt(d.order_invoice_total) + ' invoiced</p></div>';
    h += '<div class="bg-green-50 rounded-lg p-4 border border-green-200"><p class="text-sm text-green-600 font-medium">Total Revenue</p><p class="text-2xl font-bold">' + fmt(d.total_revenue) + '</p><p class="text-xs text-gray-500">Orders: ' + fmt(d.order_revenue) + ' + Sales: ' + fmt(d.sale_revenue) + '</p></div>';
    h += '<div class="bg-orange-50 rounded-lg p-4 border border-orange-200"><p class="text-sm text-orange-600 font-medium">Freight Income</p><p class="text-2xl font-bold">' + fmt(d.freight_income) + '</p><p class="text-xs text-gray-500">Orders: ' + fmt(d.order_freight) + ' + Sales: ' + fmt(d.sale_freight) + '</p></div>';
    h += '<div class="bg-purple-50 rounded-lg p-4 border border-purple-200"><p class="text-sm text-purple-600 font-medium">Total Sales</p><p class="text-2xl font-bold">' + d.total_sales + '</p><p class="text-xs text-gray-500">' + d.units + ' units | ' + d.order_boxes + ' boxes</p></div>';
    h += '</div>';

    h += '<div class="mb-4 p-4 bg-gray-50 rounded-lg"><h4 class="font-bold text-indigo-700 mb-2"><i class="fas fa-shopping-cart mr-2"></i>Orders Summary (from CSV)</h4>';
    h += '<div class="flex justify-between"><span>Total Orders:</span><span class="font-bold">' + d.total_orders + '</span></div>';
    h += '<div class="flex justify-between"><span>Order Value (excl GST):</span><span class="font-bold">' + fmt(d.order_revenue) + '</span></div>';
    h += '<div class="flex justify-between"><span>Invoice Total:</span><span class="font-bold">' + fmt(d.order_invoice_total) + '</span></div>';
    h += '<div class="flex justify-between"><span>Total Boxes:</span><span class="font-bold">' + d.order_boxes + '</span></div>';
    h += '<div class="flex justify-between"><span>Total Weight:</span><span class="font-bold">' + Number(d.order_weight).toLocaleString('en-IN') + ' Kgs</span></div>';
    h += '<div class="flex justify-between"><span>Transport/Freight:</span><span class="font-bold">' + fmt(d.order_freight) + '</span></div>';
    h += '<div class="flex justify-between"><span>Credit Notes:</span><span class="text-red-600 font-bold">' + fmt(d.order_credit_notes) + '</span></div>';
    h += '</div>';

    h += '<div class="mb-4 p-4 bg-gray-50 rounded-lg"><h4 class="font-bold text-green-700 mb-2"><i class="fas fa-receipt mr-2"></i>Sales Summary (from CSV)</h4>';
    h += '<div class="flex justify-between"><span>Sales Revenue:</span><span class="font-bold">' + fmt(d.sale_revenue) + '</span></div>';
    h += '<div class="flex justify-between"><span>Freight Income:</span><span class="font-bold">' + fmt(d.sale_freight) + '</span></div>';
    h += '<div class="flex justify-between"><span>GST Collected:</span><span class="font-bold">' + fmt(d.gst) + '</span></div>';
    h += '<div class="flex justify-between"><span>Units Sold:</span><span class="font-bold">' + d.units + '</span></div>';
    h += '<div class="flex justify-between"><span>GP from Imports:</span><span class="font-bold">' + fmt(d.gp_total_from_csv) + '</span></div>';
    if (d.gp_avg > 0) {
        h += '<div class="flex justify-between"><span>Avg GP%:</span><span class="font-bold">' + d.gp_avg.toFixed(1) + '%</span></div>';
    }
    h += '</div>';

    var gpC = d.gross_profit >= 0 ? 'text-green-600' : 'text-red-600';
    h += '<div class="mb-4 p-4 bg-green-50 rounded-lg border border-green-200"><h4 class="font-bold text-green-700 mb-2"><i class="fas fa-chart-line mr-2"></i>Combined Gross Profit</h4>';
    h += '<div class="flex justify-between text-lg"><span>Amount:</span><span class="font-bold ' + gpC + '">' + fmt(d.gross_profit) + '</span></div>';
    h += '<div class="flex justify-between"><span>Margin:</span><span class="font-bold">' + d.gross_margin.toFixed(1) + '%</span></div>';
    h += '<p class="text-xs text-gray-500 mt-1">= Total Revenue + Freight - Credit Notes</p></div>';

    h += '<div class="mb-4 p-4 bg-gray-50 rounded-lg"><h4 class="font-bold text-orange-700 mb-2"><i class="fas fa-building mr-2"></i>Operating Expenses</h4>';
    var keys = Object.keys(d.expenses || {});
    if (keys.length) {
        keys.forEach(function(k) { h += '<div class="flex justify-between"><span>' + k + ':</span><span class="text-red-600">' + fmt(d.expenses[k]) + '</span></div>'; });
    } else {
        h += '<p class="text-gray-400 text-sm">No expenses recorded</p>';
    }
    h += '<div class="flex justify-between border-t pt-1 mt-1 font-bold"><span>Total OpEx:</span><span class="text-red-600">' + fmt(d.total_opex) + '</span></div></div>';

    var ebC = d.ebitda >= 0 ? 'text-green-600' : 'text-red-600';
    h += '<div class="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200"><h4 class="font-bold text-indigo-700 mb-2">EBITDA</h4>';
    h += '<div class="flex justify-between text-lg"><span>Amount:</span><span class="font-bold ' + ebC + '">' + fmt(d.ebitda) + '</span></div>';
    h += '<div class="flex justify-between"><span>Margin:</span><span class="font-bold">' + d.ebitda_margin.toFixed(1) + '%</span></div></div>';

    var paC = d.pat >= 0 ? 'text-green-600' : 'text-red-600';
    h += '<div class="p-4 bg-gray-900 text-white rounded-lg"><h4 class="font-bold mb-2">Profit After Tax</h4>';
    h += '<div class="flex justify-between"><span>PBT:</span><span class="font-bold">' + fmt(d.ebitda) + '</span></div>';
    h += '<div class="flex justify-between"><span>Tax @ ' + d.tax_rate + '%:</span><span class="text-red-400">' + fmt(d.tax) + '</span></div>';
    h += '<div class="flex justify-between border-t pt-1 mt-1 text-xl"><span>PAT:</span><span class="font-bold ' + paC + '">' + fmt(d.pat) + '</span></div></div>';

    $('rpt-body').innerHTML = h;
    } catch(e) { console.error('Report error:', e); $('rpt-body').innerHTML = '<p class="text-red-500">Error loading report</p>'; }
}

// ---- FORM HANDLERS ----
$('f-product').addEventListener('submit', async function(e) {
    e.preventDefault();
    var id = $('f-pid').value;
    var data = {
        part_no: $('f-ppartno').value,
        name: $('f-pname').value,
        category: $('f-pcat').value,
        size: $('f-psize').value,
        load_rating: $('f-pload').value,
        hsn_code: $('f-phsn').value
    };
    if (id) {
        await api('/api/products/' + id, {method: 'PUT', body: JSON.stringify(data)});
        toast('Product updated!');
    } else {
        await api('/api/products', {method: 'POST', body: JSON.stringify(data)});
        toast('Product added!');
    }
    hideModal('m-product');
    $('f-product').reset();
    $('f-pid').value = '';
    loadProducts();
});

$('f-pricing').addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = {
        raw_material_cost: parseFloat($('f-praw').value) || 0,
        mrp: parseFloat($('f-pmrp').value) || 0,
        labor_cost: 0,
        overhead_cost: 0,
        packing_cost: 0,
        profit_margin: 0,
        gst_rate: parseFloat($('f-pgst').value) || 18
    };
    await api('/api/products/' + $('f-prpid').value + '/pricing', {method: 'PUT', body: JSON.stringify(data)});
    hideModal('m-pricing');
    toast('Pricing updated!');
    loadProducts();
});

$('f-order').addEventListener('submit', async function(e) {
    e.preventDefault();
    var id = $('f-oid').value;
    var data = {
        sl_no: parseInt($('f-oslno').value) || 0,
        po_no: $('f-opo').value,
        po_date: $('f-opodate').value,
        billing_site: $('f-obilling').value,
        shipping_site: $('f-oshipping').value,
        no_of_boxes: parseInt($('f-oboxes').value) || 0,
        value_excl_gst_freight: parseFloat($('f-ovalue').value) || 0,
        invoice_no: $('f-oinvno').value,
        invoice_date: $('f-oinvdate').value,
        invoice_amount_excl_gst: parseFloat($('f-oinvamt').value) || 0,
        weight_kgs: parseFloat($('f-oweight').value) || 0,
        freight_rate_per_kg: parseFloat($('f-ofrate').value) || 0,
        transport_charges: parseFloat($('f-otcharges').value) || 0,
        invoice_amount: parseFloat($('f-oiamt').value) || 0,
        eway_bill_no: $('f-oeway').value,
        lr_no: $('f-olr').value,
        entry_date: $('f-oentrydate').value,
        credit_note_amount: parseFloat($('f-ocnamt').value) || 0,
        credit_note_no: $('f-ocnno').value,
        transporter: $('f-otransporter').value,
        transporter_no: $('f-otransno').value
    };
    if (id) {
        await api('/api/orders/' + id, {method: 'PUT', body: JSON.stringify(data)});
        toast('Order updated!');
    } else {
        await api('/api/orders', {method: 'POST', body: JSON.stringify(data)});
        toast('Order created!');
    }
    hideModal('m-order');
    $('f-order').reset();
    $('f-oid').value = '';
    loadOrders();
});

$('f-customer').addEventListener('submit', async function(e) {
    e.preventDefault();
    var id = $('f-cid').value;
    var data = {
        customer_id: $('f-ccustid').value,
        gstin: $('f-cgstin').value,
        billing_address: $('f-cbilladdr').value,
        shipping_address: $('f-cshipaddr').value,
        state: $('f-cstate').value,
        district: $('f-cdistrict').value,
        city: $('f-ccity').value,
        pincode: $('f-cpincode').value,
        contact_name: $('f-ccontactname').value,
        contact_number: $('f-ccontactnum').value,
        contact_email: $('f-ccontactemail').value,
        exec_code: $('f-cexeccode').value,
        exec_name: $('f-cexecname').value,
        exec_number: $('f-cexecnum').value,
        exec_email: $('f-cexecemail').value,
        blacklisted: $('f-cblacklisted').checked ? 1 : 0
    };
    if (id) {
        await api('/api/customers/' + id, {method: 'PUT', body: JSON.stringify(data)});
        toast('Customer updated!');
    } else {
        await api('/api/customers', {method: 'POST', body: JSON.stringify(data)});
        toast('Customer added!');
    }
    hideModal('m-customer');
    $('f-customer').reset();
    $('f-cid').value = '';
    loadCustomers();
});

$('f-transporter').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Manual validation
    var requiredFields = [
        {id: 'f-ttransid', label: 'Transporter ID'},
        {id: 'f-tname', label: 'Name'},
        {id: 'f-tphone', label: 'Phone'},
        {id: 'f-temail', label: 'Email'},
        {id: 'f-taddr', label: 'Address'},
        {id: 'f-tstate', label: 'State'},
        {id: 'f-tdistrict', label: 'District'},
        {id: 'f-tcity', label: 'City'},
        {id: 'f-tpincode', label: 'Pincode'},
        {id: 'f-tgst', label: 'GST Number'},
        {id: 'f-tpan', label: 'PAN Number'},
        {id: 'f-tcontactperson', label: 'Contact Person'},
        {id: 'f-tcontactnum', label: 'Contact Number'}
    ];
    for (var i = 0; i < requiredFields.length; i++) {
        var el = $(requiredFields[i].id);
        if (!el.value || !el.value.trim()) {
            toast(requiredFields[i].label + ' is required', true);
            el.focus();
            return;
        }
    }
    
    var id = $('f-tid').value;
    var gstCert = '';
    var panCard = '';
    
    // Upload GST Certificate if selected
    var gstFile = $('f-tgstfile').files[0];
    if (gstFile) {
        try {
            var fd = new FormData();
            fd.append('file', gstFile);
            var res = await fetch('/api/upload', {method: 'POST', body: fd});
            var data = await res.json();
            gstCert = data.url || '';
        } catch(err) { console.error('GST upload failed:', err); }
    } else if (id) {
        var t = _transporters.find(function(x) { return x.id == id; });
        if (t) gstCert = t.gst_certificate || '';
    }
    
    // Upload PAN Card if selected
    var panFile = $('f-tpanfile').files[0];
    if (panFile) {
        try {
            var fd = new FormData();
            fd.append('file', panFile);
            var res = await fetch('/api/upload', {method: 'POST', body: fd});
            var data = await res.json();
            panCard = data.url || '';
        } catch(err) { console.error('PAN upload failed:', err); }
    } else if (id) {
        var t = _transporters.find(function(x) { return x.id == id; });
        if (t) panCard = t.pan_card || '';
    }
    
    var payload = {
        transporter_id: $('f-ttransid').value,
        name: $('f-tname').value,
        phone: $('f-tphone').value,
        email: $('f-temail').value,
        address: $('f-taddr').value,
        state: $('f-tstate').value,
        district: $('f-tdistrict').value,
        city: $('f-tcity').value,
        pincode: $('f-tpincode').value,
        gst_number: $('f-tgst').value,
        pan_number: $('f-tpan').value,
        gst_certificate: gstCert,
        pan_card: panCard,
        contact_person: $('f-tcontactperson').value,
        contact_number: $('f-tcontactnum').value,
        blacklisted: $('f-tblacklisted').checked ? 1 : 0
    };
    try {
        if (id) {
            await api('/api/transporters/' + id, {method: 'PUT', body: JSON.stringify(payload)});
            toast('Transporter updated!');
        } else {
            await api('/api/transporters', {method: 'POST', body: JSON.stringify(payload)});
            toast('Transporter added!');
        }
        hideModal('m-transporter');
        $('f-transporter').reset();
        $('f-tid').value = '';
        loadTransporters();
    } catch(err) {
        toast('Error: ' + err.message, true);
    }
});

$('f-sale').addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = {
        customer_id: parseInt($('f-slcust').value),
        product_id: parseInt($('f-slprod').value),
        quantity: parseInt($('f-slqty').value),
        unit_price: parseFloat($('f-slprice').value),
        discount_percent: parseFloat($('f-sldisc').value) || 0,
        freight_amount: parseFloat($('f-slfrt').value) || 0,
        payment_status: $('f-slstatus').value,
        payment_method: $('f-slmethod').value
    };
    var res = await api('/api/sales', {method: 'POST', body: JSON.stringify(data)});
    hideModal('m-sale');
    $('f-sale').reset();
    toast('Sale created! ' + res.invoice_no);
    loadSales();
});

$('f-expense').addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = {
        category: $('f-ecat').value,
        description: $('f-edesc').value,
        amount: parseFloat($('f-eamt').value),
        vendor: $('f-evendor').value,
        expense_date: $('f-edate').value || null
    };
    await api('/api/expenses', {method: 'POST', body: JSON.stringify(data)});
    hideModal('m-expense');
    $('f-expense').reset();
    toast('Expense added!');
    loadExpenses();
});

// ---- CSV IMPORT ----
async function importOrdersCSV(input) {
    var file = input.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('file', file);
    toast('Importing orders...');
    try {
        var r = await fetch('/api/import/orders', {method: 'POST', body: fd});
        var d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Import failed');
        toast(d.message);
        loadOrders();
    } catch(e) { toast('Error: ' + e.message, true); }
    input.value = '';
}

async function importSalesCSV(input) {
    var file = input.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('file', file);
    toast('Importing sales...');
    try {
        var r = await fetch('/api/import/sales', {method: 'POST', body: fd});
        var d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Import failed');
        toast(d.message);
        loadSales();
    } catch(e) { toast('Error: ' + e.message, true); }
    input.value = '';
}

async function importProductsCSV(input) {
    var file = input.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('file', file);
    toast('Importing products...');
    try {
        var r = await fetch('/api/import/products', {method: 'POST', body: fd});
        var d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Import failed');
        toast(d.message);
        loadProducts();
    } catch(e) { toast('Error: ' + e.message, true); }
    input.value = '';
}

async function importCustomersCSV(input) {
    var file = input.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('file', file);
    toast('Importing customers...');
    try {
        var r = await fetch('/api/import/customers', {method: 'POST', body: fd});
        var d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Import failed');
        toast(d.message);
        loadCustomers();
    } catch(e) { toast('Error: ' + e.message, true); }
    input.value = '';
}

async function importTransportersCSV(input) {
    var file = input.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('file', file);
    toast('Importing transporters...');
    try {
        var r = await fetch('/api/import/transporters', {method: 'POST', body: fd});
        var d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Import failed');
        toast(d.message);
        loadTransporters();
    } catch(e) { toast('Error: ' + e.message, true); }
    input.value = '';
}

async function importExpensesCSV(input) {
    var file = input.files[0];
    if (!file) return;
    var fd = new FormData();
    fd.append('file', file);
    toast('Importing expenses...');
    try {
        var r = await fetch('/api/import/expenses', {method: 'POST', body: fd});
        var d = await r.json();
        if (!r.ok) throw new Error(d.detail || 'Import failed');
        toast(d.message);
        loadExpenses();
    } catch(e) { toast('Error: ' + e.message, true); }
    input.value = '';
}

// ---- INIT ----
$('today-date').textContent = new Date().toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
$('f-edate').value = new Date().toISOString().split('T')[0];
loadDashboard();
