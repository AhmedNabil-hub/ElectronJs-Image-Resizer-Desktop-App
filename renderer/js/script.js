const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const fileName = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

function loadImage(e) {
  const file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError("Please Select an Image");
    return;
  }

  // Get Origial Dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    widthInput.value = this.width;
    heightInput.value = this.height;
  };

  form.style.display = "block";
  fileName.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), "imageresizer");
}

function sendImage(e) {
  e.preventDefault();

  if (!img.files[0]) {
    alertError("Please upload an image");
    return;
  }

  const width = widthInput.value;
  const height = heightInput.value;
  const imagePath = img.files[0].path;

  if (width === "" || height === "") {
    alertError("Please set height and width of image");
    return;
  }

  ipcRenderer.send("image:resize", {
    imagePath,
    width,
    height,
  });
}

ipcRenderer.on("image:done", () =>
  alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`)
);

function isFileImage(file) {
  const acceptedImageTypes = ["image/gif", "image/png", "image/jpeg"];

  return file && acceptedImageTypes.includes(file["type"]);
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "red",
      color: "white",
      textAlign: "center",
    },
  });
}

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 5000,
    close: false,
    style: {
      background: "green",
      color: "white",
      textAlign: "center",
    },
  });
}

img.addEventListener("change", loadImage);
form.addEventListener("submit", sendImage);
