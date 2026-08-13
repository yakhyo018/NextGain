console.log("Users frontend javascript file");

function applyStatusClass(selectEl) {
  const val = $(selectEl).val();
  $(selectEl).removeClass("status--active status--block status--delete");
  if (val === "ACTIVE") $(selectEl).addClass("status--active");
  else if (val === "BLOCK") $(selectEl).addClass("status--block");
  else if (val === "DELETE") $(selectEl).addClass("status--delete");
}

$(function () {
  // Sahifa yuklanganda har bir status select'iga to'g'ri rang berish
  $(".member-status").each(function () {
    applyStatusClass(this);
  });

  $(".member-status").on("change", function (e) {
    const id = e.target.id;
    console.log("id:", id);

    const memberStatus = $(`#${id}.member-status`).val();
    console.log("memberStatus:", memberStatus);

    axios
      .post("/admin/user/edit", {
        _id: id,
        memberStatus: memberStatus,
      })
      .then((response) => {
        console.log("response:", response);

        const result = response.data;
        console.log("result:", result);

        if (result.data) {
          console.log("User updated!");
          applyStatusClass(this);
          $(".member-status").blur();
        } else {
          alert("User update failed!");
        }
      })
      .catch((err) => {
        console.log(err);
        alert("User update failed!");
      });
  });
});
