const { Builder, By, until } = require("selenium-webdriver");

async function loginTest() {

let driver = await new Builder().forBrowser("chrome").build();

try {

await driver.get("https://automationexercise.com/login");

// chờ ô email xuất hiện
await driver.wait(until.elementLocated(By.name("email")), 10000);

// nhập email
await driver.findElement(By.name("email")).sendKeys("phutranbs23@gmail.com");

// nhập password
await driver.findElement(By.name("password")).sendKeys("123123");

// click login
await driver.findElement(By.xpath("//button[contains(text(),'Login')]")).click();

// chờ page load
await driver.sleep(3000);

// lấy URL
let currentUrl = await driver.getCurrentUrl();

console.log("Current URL:", currentUrl);

if (currentUrl.includes("login")) {
    console.log("Login Failed");
} else {
    console.log("Login Test Passed");
}

} catch (error) {

console.log("Test Error:", error);

} finally {

await driver.quit();

}

}

loginTest();