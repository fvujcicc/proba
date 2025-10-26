const changeBgBtn = document.getElementById("changeBgBtn");
const bgUpload = document.getElementById("bgUpload");
const phoneBtn = document.getElementById("phoneBtn");
const brushBtn = document.getElementById("brushBtn");
const colorPanel = document.getElementById("colorPanel");
const colorPicker = document.getElementById("colorPicker");
const welcomeText = document.getElementById("welcomeText");
const card = document.querySelector(".card");
const iconElements = document.querySelectorAll(".icon i"); // <--- uzima <i> ikone unutar .icon

// Promjena pozadine
changeBgBtn.addEventListener("click", () => {
  bgUpload.click();
});

bgUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.body.style.backgroundImage = `url(${event.target.result})`;
    };
    reader.readAsDataURL(file);
  }
});

// Gumb telefon -> otvara mail klijent
phoneBtn.addEventListener("click", () => {
  window.location.href = "mailto:kontakt@firma.com";
});

// Otvaranje / zatvaranje panela za biranje boje
brushBtn.addEventListener("click", () => {
  colorPanel.style.display =
    colorPanel.style.display === "flex" ? "none" : "flex";
});

// Kada korisnik odabere novu boju
colorPicker.addEventListener("input", (e) => {
  const newColor = e.target.value;

  // mijenja boju teksta u kartici
  card.style.color = newColor;
  welcomeText.style.color = newColor;

  // mijenja boju <i> ikona (material-icons)
  iconElements.forEach((icon) => {
    icon.style.color = newColor;
  });

  // mijenja boju teksta i obruba gumba
  changeBgBtn.style.color = newColor;
  changeBgBtn.style.border = `1px solid ${newColor}`;
});
