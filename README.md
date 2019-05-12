# Crazy Pizza API
3rd homework assignment for [Pirple's NodeJS master class](https://pirple.thinkific.com/courses/the-nodejs-master-class).
This project is a frontend website that inteacts with JSON RESTful API free of 3rd-party dependencies for a pizza-delivery company utilizing Stripe and MailGun external services.

![Logo](https://github.com/marta-krzyk-dev/CrazyPizzaAPI/blob/master/logo_small.jpg?raw=true)

## Features
- [x] Signup, login, logout on the site
- [x] View all the items available to order
- [x] Fill up a shopping cart
- [x] Place an order (with fake credit card credentials), and receive an email receipt

## Manual

### Set up
0. Download the project.
1. Open the command prompt (for Windows, click Start icon and type in 'cmd') and go to the project directory.eg. :
`cd C:/CrazyPizzaGUI`
2. Run the app:
`node index.js`

Optionally, one can set the environment as command line argument (with value of 'production' or 'staging'). The default is 'staging'.

`node index.js production` (for Windows)
`NODE_ENV=production node index.js` (for Linux)

Optionally, one cat set DEBUG variable to print out messages in the console.
`set DEBUG=* & node index.js` (for Windows)

3. The app informs which ports are active.
4. Open up a web browser and go to the address printed out in point 3: `localhost:3000` or `localhost:5000`. 
Follow the Basic scenario below to learn how to navigate on the website.
5. Push `Ctrl` + `C` in the console to stop the app.

### Basic scenario:

1. Go to the main page.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/1_CrazyPizza_index_GET.png?raw=true)

2. A) Click on "Get started" and create an account.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/2_CrazyPizza_Users_POST_create_an_account.png?raw=true)

2. B) If you already have an account, click on "Login" to enter your email and password.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/2B_CrazyPizza_Tokens_POST_log_in.png?raw=true)

3. You will be redirected to your shopping cart. For now, it's empty.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/3_CrazyPizza_ShoppingCart_GET_noOrderes.png?raw=true)

4. A) Create the first order by clicking "Create order". Choose whichever pizza you like from dropdown and choose the amount (1-10). Submit by hitting "Create order". You can create up to 5 orders.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/4_CrazyPizza_ShoppingCart_POST_create_an_order.png?raw=true)

5. You will be redirected to your shopping cart. You can now edit the order with "Edit/Delete" button.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/5_CrazyPizza_ShoppingCart_GET_one_order.png?raw=true)

7. You can modify the amount and the pizza type and submit your changes with "Save changes". To delete the order click "Delete order".
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/6_CrazyPizza_ShoppingCart_PUT_edit_an_order.png?raw=true)

8. To purchase, you need to click "Purchase" button next to your order in shopping cart.

9. You will be redirected to page with details of your order. Fill in your credit card information and hit "Purchase".
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/8_CrazyPizza_Purchase_POST_purchase_an_order.png?raw=true)

10. You will be notified whether your payment was accepted or not. You can go back to the shopping cart by hitting "Back" or by choosing any other page in the menu in the upper right corner.

11. After purchase, your order is gone from shopping cart.

12. To change your user information choose "Account settings" from the menu in the upper right corner.
You can change your first and last name, address and password. When ready, click "Save changes".
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/11_CrazyPizza_Users_PUT_modify_account.png?raw=true)

13. To delete the account forever click "Delete account". This action cannot be undone.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/12_CrazyPizza_Users_DELETE_delete_account.png?raw=true)

14. To log out, choose "Logout" from the menu in the upper right corner.
![](https://github.com/marta-krzyk-dev/CrazyPizzaGUI/blob/master/PrintScreens/14_CrazyPizza_Tokens_DELETE_log_out.png?raw=true)
