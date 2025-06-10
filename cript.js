
    // ======== Token Handling =========
    function saveToken() {
      const token = document.getElementById("token").value;
      if (!token) return alert("Vui lòng nhập token");
      localStorage.setItem("dht_token", token);
      checkTokenValidity(token);
    }

    function clearToken() {
      localStorage.removeItem("dht_token");
      document.getElementById("token").value = "";
      document.getElementById("token-status").textContent = "Đã xóa token.";
    }

    function loadSavedToken() {
      const token = localStorage.getItem("dht_token");
      if (token) {
        document.getElementById("token").value = token;
        checkTokenValidity(token);
      }
    }

    function checkTokenValidity(token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp;
        const now = Math.floor(Date.now() / 1000);
        if (exp && exp < now) {
          document.getElementById("token-status").textContent = "⚠️ Token đã hết hạn.";
        } else {
          const expDate = new Date(exp * 1000).toLocaleString();
          document.getElementById("token-status").textContent = `✅ Token hợp lệ, hết hạn lúc: ${expDate}`;
        }
      } catch (e) {
        document.getElementById("token-status").textContent = "❌ Token không hợp lệ.";
      }
    }

    loadSavedToken();

    // ======== SKU của Combo, LinkCoffee, Akira =========
    const comboSkus = ["CB-2.5", "CB-5.0", "CB-15", "CB-35", "CB-75", "Cb-150", "CB-300"];
    const linkCoffeeSkus = [
      "DHT_ComTrua", "DHT_BlackCoffee", "DHT-MilkCoffee", "DHT_VietnameseWhiteCoffeeIced",
      "DHT_SaltedCream", "DHT_SaltedCreamCoffee", "DHT_CoconutPandanLatte", "DHT_PandanCoconutMilkTea",
      "DHT_LiptonIcedTea", "DHT_LycheeIcedTea", "DHT_PlumIcedTea", "DHT_PlumIced", "DHT_GuavaIcedTea",
      "DHT_StrawberryTea", "DHT_Lemonade", "DHT_PineappleJuice", "DHT_OrangeJuice", "DHT_PassionFruitJuice",
      "DHT_MixedFruitJuice", "DHT_IceYogurt", "DHT_StrawberryYogurt", "DHT_PeachYogurt"
    ];
    const akiraSkus = []; // Akira sẽ là các SKU không thuộc Combo và LinkCoffee

    let validSkus = comboSkus;  // Mặc định là Combo

    // Function to update validSkus based on selected order type
    function updateValidSkus() {
      const orderType = document.getElementById("orderTypeDropdown").value;
      if (orderType === "combo") {
        validSkus = comboSkus;  // Sử dụng SKU của Combo
      } else if (orderType === "linkcoffee") {
        validSkus = linkCoffeeSkus;  // Sử dụng SKU của LinkCoffee
      } else if (orderType === "akira") {
        validSkus = akiraSkus;  // Akira không có SKU mặc định, kiểm tra ngoài
      }
    }

    // ======== Tính toán khoảng thời gian 24h của một ngày =========
    function getStartOfDay(dateStr) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0); // Đặt giờ, phút, giây, mili giây = 00:00:00
      return date;
    }

    function getEndOfDay(dateStr) {
      const date = new Date(dateStr);
      date.setHours(23, 59, 59, 999); // Đặt giờ, phút, giây, mili giây = 23:59:59
      return date;
    }

    // ======== Tính tuần =========
    function getStartEndOfWeek(dateStr) {
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Tính thứ Hai của tuần

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Cộng 6 ngày để được Chủ nhật

      const formatDate = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

      return {
        start: formatDate(startOfWeek),
        end: formatDate(endOfWeek),
      };
    }

    // ======== Tải ngày =========
    async function loadDates() {
      const token = document.getElementById("token").value;
      const dropdown = document.getElementById("dateDropdown");
      dropdown.innerHTML = "<option>Đang tải ngày...</option>";

      try {
        const response = await fetch("https://dhtshop.vn/api/admin/orders?page=1&limit=500&status=all", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const json = await response.json();
        const orders = json.data?.array || [];

        const uniqueDates = [...new Set(
          orders.map(o => new Date(o.created_at).toISOString().split('T')[0])
        )];

        dropdown.innerHTML = "";
        uniqueDates.sort((a, b) => new Date(b) - new Date(a)).forEach(date => {  
          const option = document.createElement("option");
          option.value = date;
          option.textContent = date;
          dropdown.appendChild(option);
        });

      } catch (err) {
        alert("Lỗi khi tải danh sách ngày: " + err.message);
      }
    }

    function formatDate(dateStr) {
      try {
        const date = new Date(dateStr);
        return `${date.toLocaleTimeString()} ${date.toLocaleDateString('vi-VN')}`;
      } catch {
        return dateStr;
      }
    }

    // ======== Tải tuần =========
    async function loadWeeks() {
      const token = document.getElementById("token").value;
      const dropdown = document.getElementById("weekDropdown");
      dropdown.innerHTML = "<option>Đang tải tuần...</option>";

      try {
        const response = await fetch("https://dhtshop.vn/api/admin/orders?page=1&limit=500&status=all", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const json = await response.json();
        const orders = json.data?.array || [];

        const uniqueWeeks = [...new Set(
          orders.map(o => {
            const { start, end } = getStartEndOfWeek(o.created_at);
            return `${start} - ${end}`;
          })
        )];

        dropdown.innerHTML = "";
        uniqueWeeks.sort((a, b) => new Date(b.split(' ')[0]) - new Date(a.split(' ')[0])).forEach(week => { 
          const option = document.createElement("option");
          option.value = week;
          option.textContent = week;
          dropdown.appendChild(option);
        });

      } catch (err) {
        alert("Lỗi khi tải danh sách tuần: " + err.message);
      }
    }

    // ======== Xuất đơn hàng theo ngày =========
async function exportOrders() {
  const token = document.getElementById("token").value;
  const selectedDate = document.getElementById("dateDropdown").value;

  try {
    const response = await fetch("https://dhtshop.vn/api/admin/orders?page=1&limit=500&status=all", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const json = await response.json();
    const orders = json.data?.array || [];

    const headers = [
       "STT", "Mã đơn hàng","Trạng thái","Loại thanh toán","Tổng tiền","Người duyệt","SỐ ID", "Họ và tên", "Combo", "Số lượng",
      "Tổng số combo", "LOẠI HÀNG", "SỐ LƯỢNG",
      "ĐỊA CHỈ NHẬN HÀNG", "SĐT NHẬN HÀNG", "GHI CHÚ",
      "Ngày mua hàng", "NGÀY GỬI HÀNG"
    ];

    // Lọc đơn hàng theo ngày và SKU
    const filteredOrders = orders
      .filter(item => {
        const itemDate = new Date(item.created_at);
        const startOfDay = getStartOfDay(selectedDate);
        const endOfDay = getEndOfDay(selectedDate);
        return itemDate >= startOfDay && itemDate <= endOfDay;
      })
      .filter(item => {
        const cart = JSON.parse(item.cartSnapshot || "[]");
        // Nếu orderType là Akira, lọc SKU không thuộc combo và linkcoffee
        if (validSkus === akiraSkus) {
          return cart.some(product => !comboSkus.includes(product.productDetail?.sku) && !linkCoffeeSkus.includes(product.productDetail?.sku));
        } else {
          return cart.some(product => validSkus.includes(product.productDetail?.sku)); // Lọc theo SKU Combo hoặc LinkCoffee
        }
      });

    const rows = filteredOrders.map((item, idx) => {
      const cart = JSON.parse(item.cartSnapshot || "[]");
      
      let adminData = "";
      try {
        adminData = JSON.parse(item.admin); // Giải mã chuỗi JSON trong item.admin
      } catch (e) {
        console.error("Không thể giải mã JSON từ admin:", e);
      }

      return [
       
        idx + 1,
        item.orderId || "", 
        item.status || "", 
        item.walletName || "",
        item.totalAmount || "",
        adminData.full_name || "",
        item.userPhone || "",
        item.userFullName || "",
        cart[0]?.unitPrice || "",
        cart[0]?.quantity || "",
        "", "", "", 
        item.orderAddress || "",
        item.orderPhone || "",
        "", 
        formatDate(item.created_at),
        ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const urlBlob = URL.createObjectURL(blob);

    const link = document.getElementById("downloadLink");
    const fileName = `orders_${selectedDate}.csv`;
    link.href = urlBlob;
    link.download = fileName;
    link.style.display = "inline";
    link.textContent = `📥 Tải file CSV theo ngày: ${selectedDate}`;

  } catch (err) {
    alert("Lỗi tải đơn hàng: " + err.message);
  }
}

// ======== Xuất đơn hàng theo tuần =========
async function exportOrdersByWeek() {
  const token = document.getElementById("token").value;
  const selectedWeek = document.getElementById("weekDropdown").value;

  try {
    const response = await fetch("https://dhtshop.vn/api/admin/orders?page=1&limit=500&status=all", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const json = await response.json();
    const orders = json.data?.array || [];

     const headers = [
       "STT", "Mã đơn hàng","Trạng thái","Loại thanh toán","Tổng tiền","Người Duyệt","SỐ ID", "Họ và tên", "Combo", "Số lượng",
      "Tổng số combo", "LOẠI HÀNG", "SỐ LƯỢNG",
      "ĐỊA CHỈ NHẬN HÀNG", "SĐT NHẬN HÀNG", "GHI CHÚ",
      "Ngày mua hàng", "NGÀY GỬI HÀNG"
    ];
    // Lọc đơn hàng theo tuần và SKU
    const filteredOrders = orders
      .filter(item => {
        const { start, end } = getStartEndOfWeek(item.created_at);
        return `${start} - ${end}` === selectedWeek;
      })
      .filter(item => {
        const cart = JSON.parse(item.cartSnapshot || "[]");
        // Nếu orderType là Akira, lọc SKU không thuộc combo và linkcoffee
        if (validSkus === akiraSkus) {
          return cart.some(product => !comboSkus.includes(product.productDetail?.sku) && !linkCoffeeSkus.includes(product.productDetail?.sku));
        } else {
          return cart.some(product => validSkus.includes(product.productDetail?.sku)); // Lọc theo SKU Combo hoặc LinkCoffee
        }
      });

    const rows = filteredOrders.map((item, idx) => {
      const cart = JSON.parse(item.cartSnapshot || "[]");
       let adminData = "";
      try {
        adminData = JSON.parse(item.admin); // Giải mã chuỗi JSON trong item.admin
      } catch (e) {
        console.error("Không thể giải mã JSON từ admin:", e);
      }

      return [
       
        idx + 1,
        item.orderId || "", 
        item.status || "", 
        item.walletName || "",
        item.totalAmount || "",
        adminData.full_name || "",
        item.userPhone || "",
        item.userFullName || "",
        cart[0]?.unitPrice || "",
        cart[0]?.quantity || "",
        "", "", "", 
        item.orderAddress || "",
        item.orderPhone || "",
        "", 
        formatDate(item.created_at),
        ""
      ];
    });
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const urlBlob = URL.createObjectURL(blob);

    const link = document.getElementById("downloadLink");
    const fileName = `orders_week_${selectedWeek.replace(' ', '_')}.csv`;
    link.href = urlBlob;
    link.download = fileName;
    link.style.display = "inline";
    link.textContent = `📥 Tải file CSV theo tuần: ${selectedWeek}`;

  } catch (err) {
    alert("Lỗi tải đơn hàng: " + err.message);
  }
}
