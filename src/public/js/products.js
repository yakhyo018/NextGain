function applyStatusClass(selectEl) {
  const val = $(selectEl).val();
  $(selectEl).removeClass("status--process status--pause status--delete");
  if (val === "PROCESS") $(selectEl).addClass("status--process");
  else if (val === "PAUSE") $(selectEl).addClass("status--pause");
  else if (val === "DELETE") $(selectEl).addClass("status--delete");
}

$(function () {
  // Sahifa yuklanganda har bir status select'iga to'g'ri rang berish
  $(".new-product-status").each(function () {
    applyStatusClass(this);
  });

  $(".product-collection").on("change", () => {
    const selectedValue = $(".product-collection").val();
    if (selectedValue === "DRINK") {
      $("#product-collection").hide();
      $("#product-volume").show();
    } else {
      $("#product-volume").hide();
      $("#product-collection").show();
    }
  });

  $("#process-btn").on("click", () => {
    $("#new-product-form").slideToggle(500, function () {
      $("html, body").animate(
        { scrollTop: $("#new-product-form").offset().top - 20 },
        400,
      );
    });
    $("#process-btn").css("display", "none");
  });

  $("#cancel-btn").on("click", () => {
    $("#new-product-form").slideToggle(300, function () {
      $("html, body").animate(
        { scrollTop: $("#new-product-form").offset().top + 20 },
        400,
      );
    });
    $("#process-btn").css("display", "flex");
  });

  $(".new-product-status").on("change", async function (e) {
    const id = e.target.id;
    const productStatus = $(`#${id}.new-product-status`).val();

    console.log("id:", id);
    console.log("productStatus:", productStatus);

    try {
      const response = await axios.post(`/admin/product/${id}`, {
        productStatus: productStatus,
      });

      console.log("response:", response);

      const result = response.data;

      if (result.data) {
        console.log("Product updated!");
        applyStatusClass(this);
        $(".new-product-status").blur();
      } else {
        alert("Product update failed!");
      }
    } catch (err) {
      console.log(err);
      alert("Product update failed!");
    }
  });
});

function validateForm() {
  const productName = $(".product-name-input").val();
  const productPrice = $(".product-price").val();
  const productLeftCount = $(".product-left-count").val();
  const productCollection = $(".product-collection").val();
  const productDesc = $(".product-desc").val();

  if (
    productName === "" ||
    productPrice === "" ||
    productLeftCount === "" ||
    productCollection === "" ||
    productDesc === ""
  ) {
    alert("Please insert all details!");
    return false;
  } else {
    return true;
  }
}

function previewFileHandler(input, order) {
  const imgClassName = input.className;
  console.log("input:", input);

  const file = input.files[0];
  if (!file) return;

  const fileType = file["type"];
  const validImageType = ["image/jpg", "image/jpeg", "image/png"];

  if (!validImageType.includes(fileType)) {
    alert("Please insert only jpeg, jpg and png!");
  } else {
    const reader = new FileReader();
    reader.onload = function () {
      $(`#image-section-${order}`).attr("src", reader.result);
    };
    reader.readAsDataURL(file);
  }
}
