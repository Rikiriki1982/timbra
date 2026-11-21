// Controlli automatici: aprono l'app in un browser di prova con un database finto.
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./e2e',
  timeout:30000,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{open:'never'}]]:'list',
  use:{
    baseURL:'http://localhost:4173',
    serviceWorkers:'block',
    locale:'it-IT',
    timezoneId:'Europe/Rome',
    trace:'off',
    screenshot:'only-on-failure',
    ...(process.env.PW_CHROMIUM?{launchOptions:{executablePath:process.env.PW_CHROMIUM}}:{})
  },
  webServer:{command:'node server.js',port:4173,reuseExistingServer:!process.env.CI}
});
