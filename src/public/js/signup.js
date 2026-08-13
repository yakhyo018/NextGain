$(function () {
  const fileTarget = $(".file-box .upload-hidden");
  let filename;

  fileTarget.on("change", function () {
    if (window.FileReader) {
      const uploadFile = $(this)[0].files[0];
      const fileType = uploadFile["type"];
      const validImageType = ["image/jpg", "image/jpeg", "image/png"];

      if (!validImageType.includes(fileType)) {
        alert("Please insert only jpeg, jpg and png!");
      } else {
        if (uploadFile) {
          console.log(URL.createObjectURL(uploadFile));

          $(".upload-img-preview")
            .attr("src", URL.createObjectURL(uploadFile))
            .addClass("success");
        }

        filename = $(this)[0].files[0].name;
      }

      $(this).siblings(".upload-name").val(filename);
    }
  });

  // ===== CONFIRM PASSWORD — REAL-TIME TEKSHIRUV =====
  const passwordInput = $(".member-password");
  const confirmInput = $(".confirm-password");
  const confirmStatus = $(".confirm-status");

  function checkPasswordMatch() {
    const password = passwordInput.val();
    const confirm = confirmInput.val();

    // ikkalasi ham bo'sh bo'lmasa va bir xil bo'lsa
    if (confirm.length > 0 && password === confirm) {
      confirmInput.removeClass("error").addClass("confirmed");
      confirmStatus
        .text("Confirmed")
        .removeClass("confirm-status--error")
        .addClass("confirm-status--visible");
    } else if (confirm.length > 0) {
      // yozilgan lekin mos kelmayapti — xato holat
      confirmInput.removeClass("confirmed").addClass("error");
      confirmStatus
        .text("Passwords don't match")
        .addClass("confirm-status--visible confirm-status--error");
    } else {
      // input hali bo'sh
      confirmInput.removeClass("confirmed error");
      confirmStatus
        .text("")
        .removeClass("confirm-status--visible confirm-status--error");
    }
  }

  // har ikkala inputga ham eshituvchi qo'yamiz
  // (chunki asosiy parol keyinroq o'zgartirilsa ham qayta tekshirilsin)
  passwordInput.on("input", checkPasswordMatch);
  confirmInput.on("input", checkPasswordMatch);
});

function validateSignupForm() {
  const memberNick = $(".member-nick").val();
  const memberPhone = $(".member-phone").val();
  const memberPasssword = $(".member-password").val();
  const confirmPassword = $(".confirm-password").val();

  if (
    memberNick === "" ||
    memberPhone === "" ||
    memberPasssword === "" ||
    confirmPassword === ""
  ) {
    alert("Please insert all required inputs!");
    return true;
  }

  if (memberPasssword !== confirmPassword) {
    alert("Password differs, please check!");
    return true;
  }

  const memberImage = $(".member-image").get(0).files[0].name
    ? $(".member-image").get(0).files[0].name
    : null;
  if (!memberImage) {
    alert("Please insert restaurant image!");
    return true;
  }
}
