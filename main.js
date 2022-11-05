const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");

process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";

let mainWindow;
let aboutWindow;

// Create Main Window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Image Resizer",
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Open devtools if in dev env
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// Create About Window
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "About Image Resizer",
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    width: 300,
    height: 300,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// App is ready
app.on("ready", () => {
  createMainWindow();

  // Implement Menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.on("closed", () => (mainWindow = null));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    // label: "File",
    // submenu: [
    //   {
    //     label: "Quit",
    //     click: () => {
    //       app.quit();
    //     },
    //     accelerator: "CmdOrCtrl+W",
    //   },
    // ],
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "Help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: "Developer",
          submenu: [
            { role: "reload" },
            { role: "forcereload" },
            { type: "separator" },
            { role: "toggledevtools" },
          ],
        },
      ]
    : []),
];

// respond to ipcRenderer resize resize
ipcMain.on("image:resize", (e, options) => {
  console.log(options);
  options.dest = path.join(os.homedir(), "imageresizer");
  resizeImage(options);
});

async function resizeImage(options) {
  try {
    const newPath = await resizeImg(fs.readFileSync(options.imagePath), {
      width: +options.width,
      height: +options.height,
    });

    const fileName = path.basename(options.imagePath);

    if (!fs.existsSync(options.dest)) {
      fs.mkdirSync(options.dest);
    }

    fs.writeFileSync(path.join(options.dest, fileName), newPath);

    mainWindow.webContents.send("image:done");

    shell.openPath(options.dest);
  } catch (error) {
    console.log(error);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
