# Pneumatic-js

Pneumatic allows you to build scalable, extendable pipelines that can transform
or filter messages before they reach a target object. Best of all, Pneumatic
requires almost no changes to your original objects, so you can easily plug it
in to any project!

All you have to do is...

 1. Define the interface between two objects
 2. Define the operations to be performed in the pipeline

Then, you can snap together multiple pipes, call methods on the pipeline as if
it were the original object!

## Example

### Background

Say that you have two classes, a merchant and a customer, that are implemented
as so:

```javascript
class Merchant {
    getPrice(customer, item) {
        if (item === 'apple') {
            return 1;
        } else if (item === 'orange') {
            return 2;
        }
    }

    sendCoupon(coupon) {
        this.customer.acceptCoupon(this, coupon);
    }
}

class Customer {
    acceptCoupon(merchant, coupon) {
        console.log(coupon);
    }

    queryPrice(item) {
        this.merchant.getPrice(this, item);
    }
}
```

The `Merchant` calls `acceptCoupon` on the customer to give them a coupon, and the
`Customer` calls `getPrice` on the merchant to enquire about the price of an
item. `sendCoupon` and `queryPrice` are for demonstration purposes, and simply
call functions on the other object. 

Note: the first argument of `getPrice` and `acceptCoupon` (the "sender") is 
required for using the Pneumatic API.

Both classes are simple, but imagine you want to add more functionality. You
want to make the Merchant's price look-up robust to differences in capitilization, 
and you also want it to report the price after sales tax. Imagine also that you
want to let the customer ignore some coupons, in case they're getting too many.

One way to make these changes would be to modify the classes. But doing so
would start to bloat the classes with unecssary functionality. Why should a 
merchant need to know to make a string lowercase? Furthermore, the functionality
is coupled to the classes. What if we want to implement lowercasing in another class?

Pneumatic solves these problems by providing an object that can sit between
any two objects, called a Pipe. Classes can call methods on a pipe as if it
were the object itself, and then the pipe can perform operations on the arguments
(such as making all the letters lowercase), before forwarding the call to the
object.

### Creating Pipes

First, define the interface that the two objects communicate with

```javascript
import { Pipe, OnewayCollection, TwowayCollection } from 'https://denopkg.com/sColin16/pneumatic-js/index.js'

class MerchantCustomerPipe extends Pipe {
    static FIRST_INTERFACE = Merchant;
    static SECOND_INTERFACE = Customer;
}

MerchantCustomerPipe.addInterfaceMethod(Customer, 'acceptCoupton', OnewayCollection);
MerchantCustomerPipe.addInterfaceMethod(Merchant, 'getPrice', TwowayCollection);
```

Where `OnewayCollection` allows applying transformations when a message goes
only one way (void functions), as is true of `acceptCoupon`, and `TwowayCollection`
allows applying transformations when a message goes both ways (a non-void
function) as in `getPrice`.

Next, create a subclasses of the pipe, where you define individual operations

```javascript
class CouponFilterPipe extends MerchantCustomerPipe {
    filterAcceptCoupon(coupon) {
        if (coupon != '100% off') {
            return true;
        }

        return false;
    }
}

class CouponConditionsPipe extends MerchantCustomerPipe {
    transformAcceptCoupon(coupon) {
        return coupon + " (conditions apply)";
    }
}

class LowerCasePipe extends MerchantCustomerPipe {
    transformRequestGetPrice(item) {
        // Must return a list to support multiple argument transformations

        return [item.toLowerCase()];
    }
}

class SalesTaxPipe extends MerchantCustomerPipe {
    transformResponseGetPrice(price) {
        const salesTax = 0.07;

        return price * (1 + salesTax);
    }
}
```

When you define the interfaces, Pneumatic dynamically creates functions
that don't make any changes to the data flow of the system. By defining
the functions in the classes above, you override these functions, adding
behavoir to the pipes. Note that the names of the generated functions
are determined by the names of the interface methods, and the 
`OperationCollection` defined for that interface.


### Creating Pipelines

Think of pipelines as doubly-linked lists of pipes. It is then necessary
to use just one function: 
`appendToPipeline(interfaceClass, object)`. This function will append the 
given object (whether it is a pipe, or one of the objects you're working with)
to the end of the linked list, at the side of the given interface.

For example, if you had the pipeline below, which operated on interfaces 
A and B

```
     +---------+      +---------+
     |         |      |         |
+--+A|  PipeX  |B+--+A|  PipeY  |B+--+
     |         |      |         |
     +---------+      +---------+
```

Then called `PipeX.appendToPipeline(B, PipeZ)`, the result would be

```
     +---------+      +---------+      +---------+
     |         |      |         |      |         |
+--+A|  PipeX  |B+--+A|  PipeY  |B+--+A|  PipeZ  |B+--+
     |         |      |         |      |         |
     +---------+      +---------+      +---------+
```

You can call `appendToPipeline` on any pipe in a pipeline, and it will
behave appropriately

In the Customer/Merchant example, we could do this like so:

```javascript

let couponFilterPipe = new CouponPipe();
let couponConditionPipe = new CouponConditionsPipe();
let lowercasePipe = new LowerCasePipe();
let salesTaxPipe = new SalesTaxPipe();

let merchantCustomerPipeline = couponFilterPipe;
merchantCustomerPipeline.appendToPipeline(Customer, couponConditionPipe);
merchantCustomerPipeline.appendToPipeline(Customer, lowerCasePipe);
merchantCustomerPipeline.appendToPipeline(Customer, salesTaxPipe);
```

Our pipleline looks like this:

```
     +----------+      +----------+      +----------+      +----------+
     |          |      |          |      |          |      |          |
     |  Coupon  |      |  Coupon  |      |  Lower   |      |  Sales   |
+--+M|  Filter  |C+--+M|  Condit. |C+--+M|  Case    |C+--+M|   Tax    |C+--+
     |          |      |          |      |          |      |          |
     +----------+      +----------+      +----------+      +----------+
```

If we wish to not change the Merchant or Customer classes, we can link them
to the pipeline like so:

```javascript

let merchant = new Merchant();
let customer = new Customer();

merchantCustomerPipe.appendToPipeline(Customer, customer);
merchantCustomerPipe.appendToPipeline(Merchant, merchant);

merchant.customer = merchantCustomerPipe.getPipelineEnd(Merchant);
customer.merchant = merchantCustomerPipe.getPipelineEnd(Customer);
```

Then use the merchant and customers like normal:
```javascript
customer.queryPrice('APPLE');   // 1.07
customer.queryPrice('OrAnGe');  // 2.14

merchant.sendCoupon('95% off')  // [Nothing printed]
merchant.sendCoupon('95% off')  // 100% off (conditions apply)
```

Stay tuned for:
 * Examples of creating custom operations and operation collections
 * API features like pipelines that are dynamically created when 
   an object is appended to a Pipeline

## Roadmap

Check out the [Trello Board](https://trello.com/b/5LoKS2xK) to see features on the road map

## Details

Pneumatic leverages bracket notation and function factories to dynamically
create classes that implement the interface between two objects, and that can
perform operations when interface methods are called
