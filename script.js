// ======================================================
// SK ENTERPRISE - INVOICE GENERATOR
// Supabase Login + Workspace Selection + Sales Register
// ======================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ---------------- SUPABASE CONFIGURATION ----------------

const SUPABASE_URL = "https://blbaolnlzohguwqiyflg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsYmFvbG5sem9oZ3V3cWl5ZmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjY2ODgsImV4cCI6MjA4MzcwMjY4OH0.nGCG_M3-m2hNnP8Nu0aftZ1Ug0OheU5GmbGNr-Iwxxg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------- CONFIGURATION ----------------

const INITIAL_ROWS = 10;
const TAX_OPTIONS = [0, 5, 12, 18, 28];

const state = {
    items: [],
    user: null,
    companyId: null
};
    
// ---------------- LOGIN SCREEN ----------------

function showLoginScreen() {
    if (document.getElementById("login-screen")) return;

    const screen = document.createElement("div");
    screen.id = "login-screen";

    screen.innerHTML = `
        <style>
            #login-screen {
                position:fixed;
                inset:0;
                z-index:99999;
                background:#f4f5f7;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
                font-family:Arial,sans-serif;
            }

            .login-card {
                width:100%;
                max-width:390px;
                box-sizing:border-box;
                background:white;
                padding:34px;
                border-radius:12px;
                box-shadow:0 8px 35px rgba(0,0,0,.08);
            }

            .login-card h2 {
                margin:0 0 8px;
                color:#202124;
                font-size:23px;
            }

            .login-card p {
                color:#6b7280;
                font-size:14px;
                margin-bottom:26px;
            }

            .login-card label {
                display:block;
                font-size:13px;
                font-weight:600;
                margin:15px 0 7px;
                color:#374151;
            }

            .login-card input {
                width:100%;
                box-sizing:border-box;
                padding:12px;
                border:1px solid #d1d5db;
                border-radius:6px;
                font-size:14px;
            }

            #login-button {
                width:100%;
                margin-top:22px;
                padding:13px;
                background:#2563eb;
                color:white;
                border:0;
                border-radius:6px;
                font-weight:600;
                cursor:pointer;
            }

            #login-button:disabled {
                opacity:.6;
                cursor:not-allowed;
            }

            #login-error {
                color:#dc2626;
                font-size:13px;
                margin-top:13px;
            }
        </style>

        <div class="login-card">
            <h2>ZenterPrime Login</h2>
            <p>Sign in to connect this invoice generator with your workspace.</p>

            <form id="login-form">
                <label>Email Address</label>
                <input type="email" id="login-email"
                    placeholder="Enter your email" required>

                <label>Password</label>
                <input type="password" id="login-password"
                    placeholder="Enter your password" required>

                <button type="submit" id="login-button">Sign In</button>

                <div id="login-error"></div>
            </form>
        </div>
    `;

    document.body.appendChild(screen);

    document.getElementById("login-form")
        .addEventListener("submit", handleLogin);
}

// ---------------- FETCH USER WORKSPACES ----------------

async function getUserWorkspaces(userId) {
    const { data, error } = await supabase
        .from("companies")
        .select("id, name, gstin, address")
        .eq("created_by", userId)
        .eq("is_deleted", false)
        .order("name", { ascending: true });

    if (error) {
        console.error(error);
        throw new Error("Unable to load workspaces. Check companies table RLS.");
    }

    if (!data || data.length === 0) {
        throw new Error("No workspace found for this account.");
    }

    return data;
}

// ---------------- WORKSPACE SELECTION SCREEN ----------------

function showWorkspaceSelection(companies) {
    document.getElementById("workspace-screen")?.remove();

    const screen = document.createElement("div");
    screen.id = "workspace-screen";

    screen.innerHTML = `
        <style>
            #workspace-screen {
                position:fixed;
                inset:0;
                z-index:100000;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px;
                background:#f4f5f7;
                font-family:Arial,sans-serif;
            }

            .workspace-card {
                width:100%;
                max-width:480px;
                max-height:85vh;
                overflow-y:auto;
                box-sizing:border-box;
                padding:30px;
                background:white;
                border-radius:12px;
                box-shadow:0 8px 35px rgba(0,0,0,.08);
            }

            .workspace-card h2 {
                margin:0 0 8px;
                color:#202124;
                font-size:23px;
            }

            .workspace-card p {
                color:#6b7280;
                font-size:14px;
                margin-bottom:22px;
            }

            .workspace-option {
                display:block;
                width:100%;
                box-sizing:border-box;
                text-align:left;
                padding:16px;
                margin-top:10px;
                border:1px solid #e5e7eb;
                border-radius:8px;
                background:white;
                cursor:pointer;
            }

            .workspace-option:hover {
                border-color:#2563eb;
                background:#f8faff;
            }

            .workspace-option:disabled {
                opacity:.6;
                cursor:not-allowed;
            }

            .workspace-name {
                display:block;
                color:#202124;
                font-weight:700;
                font-size:15px;
            }

            .workspace-meta {
                display:block;
                margin-top:5px;
                color:#6b7280;
                font-size:12px;
            }

            #workspace-error {
                color:#dc2626;
                font-size:13px;
                margin-top:14px;
            }

            .workspace-logout {
                margin-top:18px;
                padding:8px 0;
                border:0;
                background:none;
                color:#6b7280;
                cursor:pointer;
            }
        </style>

        <div class="workspace-card">
            <h2>Select Workspace</h2>
            <p>Choose where this invoice should be saved.</p>

            <div id="workspace-list"></div>
            <div id="workspace-error"></div>

            <button type="button" class="workspace-logout"
                id="workspace-logout">Sign out</button>
        </div>
    `;

    document.body.appendChild(screen);

    const list = screen.querySelector("#workspace-list");

    companies.forEach(company => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "workspace-option";

        const name = document.createElement("span");
        name.className = "workspace-name";
        name.textContent = company.name || "Unnamed Workspace";

        const meta = document.createElement("span");
        meta.className = "workspace-meta";
        meta.textContent = company.gstin
            ? `GSTIN: ${company.gstin}`
            : "ZenterPrime Workspace";

        button.append(name, meta);

        button.addEventListener("click", () => {
            selectWorkspace(company);
        });

        list.appendChild(button);
    });

    screen.querySelector("#workspace-logout")
        .addEventListener("click", async () => {
            await supabase.auth.signOut();

            state.user = null;
            state.companyId = null;

            screen.remove();
            showLoginScreen();
        });
}

// ---------------- SELECT WORKSPACE ----------------

async function selectWorkspace(company) {
    const errorBox = document.getElementById("workspace-error");
    const buttons = document.querySelectorAll(".workspace-option");

    buttons.forEach(button => button.disabled = true);

    try {
        // Verify ownership again from Supabase.

        const { data, error } = await supabase
            .from("companies")
            .select("id")
            .eq("id", company.id)
            .eq("created_by", state.user.id)
            .eq("is_deleted", false)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            throw new Error("You do not have access to this workspace.");
        }

        state.companyId = data.id;

        // Update active workspace preference in profile.

        const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
                id: state.user.id,
                active_company_id: data.id
            });

        if (profileError) {
            console.warn(
                "Active workspace preference was not updated:",
                profileError.message
            );
        }

        document.getElementById("workspace-screen")?.remove();

        console.log("Selected workspace:", company.name);
        console.log("Workspace ID:", state.companyId);

    } catch (error) {
        if (errorBox) {
            errorBox.textContent = error.message;
        }

        buttons.forEach(button => button.disabled = false);
    }
}

// ---------------- LOAD WORKSPACES ----------------

async function loadAndChooseWorkspace(user) {
    state.user = user;
    state.companyId = null;

    const companies = await getUserWorkspaces(user.id);

    if (companies.length === 1) {
        await selectWorkspace(companies[0]);
        return;
    }

    showWorkspaceSelection(companies);
}

// ---------------- LOGIN HANDLER ----------------

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const button = document.getElementById("login-button");
    const errorBox = document.getElementById("login-error");

    button.disabled = true;
    button.textContent = "Signing in...";
    errorBox.textContent = "";

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        document.getElementById("login-screen")?.remove();

        await loadAndChooseWorkspace(data.user);

    } catch (error) {
        errorBox.textContent = error.message || "Login failed.";

        button.disabled = false;
        button.textContent = "Sign In";
    }
}

// ---------------- EXISTING SESSION ----------------

async function initializeAuthentication() {
    showLoginScreen();

    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
            document.getElementById("login-screen")?.remove();

            await loadAndChooseWorkspace(data.session.user);
        }

    } catch (error) {
        console.error("Authentication error:", error);

        state.user = null;
        state.companyId = null;

        await supabase.auth.signOut();

        document.getElementById("workspace-screen")?.remove();

        showLoginScreen();

        const errorBox = document.getElementById("login-error");

        if (errorBox) {
            errorBox.textContent = error.message;
        }
    }
}

// ---------------- NUMBER TO WORDS ----------------

function numberToWords(amount) {
    const words = [
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];

    const tens = [
        "", "", "Twenty", "Thirty", "Forty",
        "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    function convert(n) {
        if (n < 20) return words[n];

        if (n < 100) {
            return tens[Math.floor(n / 10)] +
                (n % 10 ? " " + words[n % 10] : "");
        }

        if (n < 1000) {
            return words[Math.floor(n / 100)] + " Hundred" +
                (n % 100 ? " and " + convert(n % 100) : "");
        }

        if (n < 100000) {
            return convert(Math.floor(n / 1000)) + " Thousand" +
                (n % 1000 ? " " + convert(n % 1000) : "");
        }

        if (n < 10000000) {
            return convert(Math.floor(n / 100000)) + " Lakh" +
                (n % 100000 ? " " + convert(n % 100000) : "");
        }

        return "";
    }

    const num = Math.floor(amount);

    return num === 0
        ? "Zero Rupees Only"
        : convert(num) + " Rupees Only";
}

// ---------------- INITIALIZE ROWS ----------------

function initRows() {
    state.items = [];

    const body = document.getElementById("items-body");
    body.innerHTML = "";

    for (let i = 0; i < INITIAL_ROWS; i++) {
        addRow();
    }

    calculateGrandTotal();
}

// ---------------- ADD ROW ----------------

function addRow() {
    const body = document.getElementById("items-body");
    const index = state.items.length;

    const item = {
        sr: index + 1,
        particulars: "",
        hsn: "",
        qty: 0,
        rate: 0,
        tax: 0,
        amount: 0,
        cgst: 0,
        sgst: 0,
        total: 0
    };

    state.items.push(item);

    const tr = document.createElement("tr");
    tr.className = "border-b border-black h-8";

    tr.innerHTML = `
        <td class="border-r border-black text-center p-1">
            ${item.sr}
        </td>

        <td class="border-r border-black p-1">
            <input class="w-full outline-none p-val">
        </td>

        <td class="border-r border-black p-1">
            <input class="w-full outline-none text-center hsn-val">
        </td>

        <td class="border-r border-black p-1">
            <input type="number" class="w-full outline-none text-center qty-val">
        </td>

        <td class="border-r border-black p-1">
            <input type="number" class="w-full outline-none text-right rate-val">
        </td>

        <td class="border-r border-black text-right amt-cell p-1">
            0.00
        </td>

        <td class="border-r border-black p-1">
            <select class="w-full bg-transparent tax-val">
                ${TAX_OPTIONS.map(t =>
                    `<option value="${t}">${t}%</option>`
                ).join("")}
            </select>
        </td>

        <td class="border-r border-black text-right cgst-cell p-1">
            0.00
        </td>

        <td class="border-r border-black text-right sgst-cell p-1">
            0.00
        </td>

        <td class="text-right font-bold total-cell p-1">
            0.00
        </td>
    `;

    body.appendChild(tr);

    attachListeners(tr, index);
}

// ---------------- INPUT LISTENERS ----------------

function attachListeners(row, idx) {
    row.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("input", event => {
            const val = event.target.value;

            if (el.classList.contains("qty-val")) {
                state.items[idx].qty = parseFloat(val) || 0;
            }

            if (el.classList.contains("rate-val")) {
                state.items[idx].rate = parseFloat(val) || 0;
            }

            if (el.classList.contains("tax-val")) {
                state.items[idx].tax = parseFloat(val) || 0;
            }

            if (el.classList.contains("p-val")) {
                state.items[idx].particulars = val;
            }

            if (el.classList.contains("hsn-val")) {
                state.items[idx].hsn = val;
            }

            updateCalculations(idx);
        });
    });
}

// ---------------- CALCULATE ROW ----------------

function updateCalculations(idx) {
    const item = state.items[idx];

    const amount = item.qty * item.rate;
    const taxAmt = amount * item.tax / 100;

    item.amount = amount;
    item.cgst = taxAmt / 2;
    item.sgst = taxAmt / 2;
    item.total = amount + taxAmt;

    const row = document.getElementById("items-body").children[idx];

    row.querySelector(".amt-cell").textContent = amount.toFixed(2);
    row.querySelector(".cgst-cell").textContent = item.cgst.toFixed(2);
    row.querySelector(".sgst-cell").textContent = item.sgst.toFixed(2);
    row.querySelector(".total-cell").textContent = item.total.toFixed(2);

    calculateGrandTotal();
}

// ---------------- GRAND TOTAL ----------------

function calculateGrandTotal() {
    let tQty = 0;
    let tAmt = 0;
    let tCgst = 0;
    let tSgst = 0;
    let tTotal = 0;

    state.items.forEach(item => {
        tQty += item.qty;
        tAmt += item.amount;
        tCgst += item.cgst;
        tSgst += item.sgst;
        tTotal += item.total;
    });

    const grandFinal = Math.round(tTotal);
    const roundOff = grandFinal - tTotal;

    document.getElementById("total-qty").textContent = tQty;
    document.getElementById("sub-total").textContent = tAmt.toFixed(2);
    document.getElementById("total-cgst").textContent = tCgst.toFixed(2);
    document.getElementById("total-sgst").textContent = tSgst.toFixed(2);
    document.getElementById("table-grand-total").textContent = tTotal.toFixed(2);

    const summaryGst = document.getElementById("summary-total-gst");

    if (summaryGst) {
        summaryGst.textContent = (tCgst + tSgst).toFixed(2);
    }

    document.getElementById("round-off-value").textContent = roundOff.toFixed(2);
    document.getElementById("grand-total").textContent = grandFinal.toFixed(2);

    document.getElementById("grand-total-words").textContent =
        numberToWords(grandFinal);
}

// ---------------- SAVE INVOICE ----------------

async function saveInvoice() {
    const saveButton = document.getElementById("save-btn");

    if (!state.user || !state.companyId) {
        alert("Please sign in and select a workspace first.");
        return;
    }

    const customerName = document.getElementById("billTo").value.trim();
    const invoiceNumber = document.getElementById("billNumber").value.trim();
    const invoiceDate = document.getElementById("dated").value;

    if (!customerName || !invoiceNumber || !invoiceDate) {
        alert("Please enter customer name, invoice number and date.");
        return;
    }

    const validItems = state.items.filter(item =>
        item.particulars.trim() !== "" && item.qty > 0
    );

    if (!validItems.length) {
        alert("Please add at least one invoice item.");
        return;
    }

    const totalWithoutGst = validItems.reduce(
        (sum, item) => sum + item.amount, 0
    );

    const totalGst = validItems.reduce(
        (sum, item) => sum + item.cgst + item.sgst, 0
    );

    const actualTotal = validItems.reduce(
        (sum, item) => sum + item.total, 0
    );

    const grandTotal =
        parseFloat(document.getElementById("grand-total").textContent) || 0;

    const roundOff = grandTotal - actualTotal;

    const purchaseOrder =
        document.getElementById("purchaseOrder")?.value.trim() || "";

    const invoiceItems = validItems.map(item => ({
        sr: item.sr,
        particulars: item.particulars,
        hsn: item.hsn,
        qty: item.qty,
        rate: item.rate,
        tax: item.tax,
        amount: Number(item.amount.toFixed(2)),
        cgst: Number(item.cgst.toFixed(2)),
        sgst: Number(item.sgst.toFixed(2)),
        total: Number(item.total.toFixed(2))
    }));

    const invoiceData = {
        company_id: state.companyId,
        customer_name: customerName,
        invoice_number: invoiceNumber,
        date: invoiceDate,
        total_without_gst: Number(totalWithoutGst.toFixed(2)),
        total_gst: Number(totalGst.toFixed(2)),
        grand_total: grandTotal,
        status: "Pending",
        is_deleted: false,
        description: purchaseOrder,
        items: invoiceItems,
        round_off: Number(roundOff.toFixed(2))
    };

    saveButton.disabled = true;

    const originalText = saveButton.textContent;
    saveButton.textContent = "Saving...";

    try {
        const { error } = await supabase
            .from("sales_invoices")
            .insert([invoiceData]);

        if (error) throw error;

        alert("Invoice successfully saved to ZenterPrime Sales Register.");

    } catch (error) {
        console.error("Invoice save error:", error);
        alert("Unable to save invoice: " + error.message);

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
    }
}

// ---------------- BUTTON EVENTS ----------------

document.getElementById("add-row-btn").onclick = addRow;

document.getElementById("print-btn").onclick = () => {
    window.print();
};

document.getElementById("reset-btn").onclick = initRows;

document.getElementById("save-btn").onclick = saveInvoice;

// ---------------- APPLICATION START ----------------

initRows();
initializeAuthentication();