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
}

class Customer {
    acceptCoupon(merchant, coupon) {
        console.log(`Got the coupon ${coupon} from ${merchant}`);
    }
}
```

The `Merchant` calls `acceptCoupon` on the customer to give them a coupon, and the
`Customer` calls `getPrice` on the merchant to enquire about the price of an
item. Note that the first argument, the "sender" is necessary for using Pneumatic

First, create a pipe that represent the interface that these two objects
communicate through

```javascript
import { Pipe, OnewayCollection, TwowayCollection } from 'https://denopkg.com/sColin16/pneumatic-js/index.js'

class MerchantCustomerPipe extends Pipe {
    static FIRST_INTERFACE_NAME = 'merchant';
    static SECOND_INTERFACE_NAME = 'customer';
}

MerchantCustomerPipe.addInterfaceMethod('acceptCoupton', 'customer', OnewayCollection);
MerchantCustomerPipe.addInterfaceMethod('getPrice', 'merchant', TwowayCollection);
```

Where `OnewayCollection` allows applying transformations when a message goes
only one way (void functions), as is true of `acceptCoupt`, and `TwowayCollection`
allows applying transformations when a message goes both ways (a non-void
function) as in `getPrice`.

Next create a subclass of the pipe you defined, which defines the operations to
perform on each interface

```javascript
class MyPipe extends MerchantCustomerPipe {
    filterAcceptCoupon(coupon) {
        if (coupon != '100% off') {
            return true;
        }

        return false;
    }

    transformAcceptCoupon(coupon) {
        return coupon + " (conditions apply)";
    }

    transformRequestGetPrice(item) {
        // Must return a list to support multiple argument transformations

        return [item.toLowerCase()];
    }

    transformResponseGetPrice(price) {
        const salesTax = 0.07;

        return price * (1 + salesTax);
    }
}
```

Where each of the functions above were automatically added to the
`MerchantCustomerPipe` class based on the name of method, and the
`OperationCollection` specified. Note that if you don't override one of the
functions, a default version that does not modify the arguments or the flow in
any way will be used. For the sake of example, all the transformations have been placed
in a single pipe, but it may be better practice to place them into separate
pipes.

Finally, bind an instance of the merchant and the customer to the pipe, and then
each object can call functions on the pipe instance as if they were calling it
on the other object, while having the specified operations applied

```javascript

let merchant = new Merchant();
let customer = new Customer();

let pipe = new MyPipe(merchant, customer);

pipe.getPrice(customer, 'APPLE');   // 1.07
pipe.getPrice(customer, 'OrAnGe');  // 2.14
pipe.getPrice(merchant, 'apple');   // Error: customer must be the sender of getPrice

pipe.acceptCoupon(merchant, '95% off');   // [Nothing printed]
pipe.acceptCoupon(merchant, '100% off');  // 100% off (conditions apply)
```

Stay tuned for:
 * Examples of creating custom operations and operation collections
 * Additional features to make linking pipes and objects easier

## Roadmap

Check out the [Trello Board](https://trello.com/b/5LoKS2xK) to see what's on the road map

## Details

Pneumatic leverages bracket notation and function factories to dynamically
create classes that implement the interface between two objects, and that can
perform operations when interface methods are called

