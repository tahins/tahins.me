---
title: Test Driven Development (TDD) by example
description: Contrary to popular belief, TDD is not a testing process. It is a design process. It’s a robust way of designing software components interactively, one unit at a time, by making sure that the individual component’s…
pubDate: 2018-04-25T16:21:43.000Z
tags:
  - tdd
  - programming
  - test-driven-development
  - software-development
  - testing
draft: false
updatedDate: 2018-04-26T15:50:14.644Z
heroImage: https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200&fm=webp&q=75
heroImageCredit:
  photographer: Robert Collins
  photographerUrl: https://unsplash.com/@robbie36
  unsplashUrl: https://unsplash.com/photos/tvc5imO5pXk
originalUrl: https://tahins.medium.com/ccf34a785233
---

Contrary to popular belief, TDD is not a testing process. It is a design process. It’s a robust way of designing software components interactively, one unit at a time, by making sure that the individual component’s behavior is specified through unit tests beforehand.

I have discussed at length about the mindset one should have prior to applying TDD in my last story. You can read it from the link below.

> [The mindset behind Test Driven Development (TDD)](https://medium.com/@tahins/the-mindset-behind-test-driven-development-tdd-b02deccbff81)

In this story we'll see what a basic implementation of TDD looks like. Note that, I will not cover the nitty-gritty of unit testing which includes concepts like setting up tests, mocking, different types of assertion etc. I will try to portray the idea as programming language and unit testing framework agnostically as possible. However, I will be using JavaScript throughout my example.

Let’s say we have to write a function that will take ’n’ as a parameter and will return the ‘nth’ Fibonacci number in the Fibonacci series. Can we do that using TDD approach? Let’s try.

First, let’s write our first test.

```
/FibonacciSpec.js
```

```
it('should return 0 as the 1st Fibonacci number', () => {
 expect(getNthFibonacci(1)).toBe(0);
});
```

Now if we run the above test we will get the following output.

```
Fibonacci should return 0 as the 1st Fibonacci number
ReferenceError: getNthFibonacci is not defined
```

Obviously, we will get an error as we didn’t define any getNthFibonacci method yet. Let’s write the method.

```
/Fibonacci.js
```

```
function getNthFibonacci (n) {
 
}
```

Now, if we run the test, we will get –

```
Fibonacci should return 0 as the 1st Fibonacci number
Expected undefined to be 0.
```

Our getNthFibonacci method is not returning the right value. In fact, it’s not returning anything. Let’s fix that and run the test.

```
/Fibonacci.js
```

```
function getNthFibonacci (n) {
 return 0; 
}
```

```
Fibonacci
 should return 0 as the 1st Fibonacci number
```

Hoorah!!! Now the test has passed. Let’s write our second test and run it.

```
/FibonacciSpec.js
```

```
it(‘should return 1 as the 2nd Fibonacci number’, () => {
 expect(getNthFibonacci(2)).toBe(1);
});
```

```
Fibonacci should return 1 as the 2nd Fibonacci number
Expected 0 to be 1.
```

Opps, the test has failed again. Let’s make changes in our code to pass this test and run the test again.

```
/Fibonacci.js
```

```
function getNthFibonacci (n) {
 return n — 1; 
}
```

```
Fibonacci
 should return 1 as the 2nd Fibonacci number
```

Great!!! Our 2nd test has passed.

Now, let’s write our 3rd test and run it.

```
/FibonacciSpec.js
```

```
it(‘should return 1 as the 3rd Fibonacci number’, () => {
 expect(getNthFibonacci(3)).toBe(1);
});
```

```
Fibonacci should return 1 as the 3rd Fibonacci number
Expected 2 to be 1.
```

Let’s write code to pass this test.

```
/Fibonacci.js
```

```
function getNthFibonacci (n) {
 if (n > 2) {
 return getNthFibonacci (n — 1) + getNthFibonacci (n — 2);
 }
```

```
 return n — 1;
}
```

```
Fibonacci
 should return 1 as the 3rd Fibonacci number
```

Let’s write another test to solidify our Fibonacci generation logic and run it.

```
/FibonacciSpec.js
```

```
it(‘should return 8 as the 7th Fibonacci number’, () => {
 expect(getNthFibonacci(7)).toBe(8);
});
```

```
Fibonacci
 should return 8 as the 7th Fibonacci number
```

Looks like our logic is fine. This is a good time to do a refactor. Let’s refactor this code to improve its readability and run all the tests.

```
/Fibonacci.js
```

```
function getNthFibonacci (n) {
 return (n === 1 || n === 2) ? n — 1
  : getNthFibonacci (n — 1) + getNthFibonacci (n — 2);
}
```

```
Fibonacci
 should return 0 as the 1st Fibonacci number
```

```
 should return 1 as the 2nd Fibonacci number
```

```
 should return 1 as the 3rd Fibonacci number
```

```
 should return 8 as the 7th Fibonacci number
```

Looks great. However, we want our getNthFibonacci method to throw an error if the ’n’ is 0 or a negative number. Let’s write few tests for that and run them.

```
/FibonacciSpec.js
```

```
it(‘should throw an error when n is 0’, () => {
 expect(() => getNthFibonacci(0)).toThrowError(‘n cannot be 0 or a negative number’);
});
```

```
it(‘should throw an error when n is a negative number’, () => {
 expect(() => getNthFibonacci(-3)).toThrowError(‘n cannot be 0 or a negative number’);
});
```

```
Fibonacci should throw an error when n is 0
RangeError: Maximum call stack size exceeded.
```

```
Fibonacci should throw an error when n is a negative number
RangeError: Maximum call stack size exceeded.
```

We need to write some code to handle these situations.

```
/Fibonacci.js
```

```
function getNthFibonacci (n) {
 if (n <= 0) throw new Error(‘n cannot be 0 or a negative number’)
 
 return (n === 1 || n === 2) ? n — 1
 : getNthFibonacci (n — 1) + getNthFibonacci (n — 2);
}
```

```
Fibonacci
 should return 0 as the 1st Fibonacci number
 should return 1 as the 2nd Fibonacci number
 should return 1 as the 3rd Fibonacci number
 should return 8 as the 7th Fibonacci number
 should throw an error when n is 0
 should throw an error when n is a negative number
```

Marvelous!!! Looks like we have a solid getNthFibonacci method with a concrete set of tests. We just finished development of a simple Fibonacci number generating function using TDD approach.

<figure>
<img src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&fm=webp&q=75" srcset="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400&fm=webp&q=75 400w, https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&fm=webp&q=75 800w, https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=1200&fm=webp&q=75 1200w" sizes="(max-width: 768px) 100vw, 800px" alt="" loading="lazy" />
<figcaption class="unsplash-credit">Photo by <a href="https://unsplash.com/@robbie36">Robert Collins</a> on <a href="https://unsplash.com/photos/tvc5imO5pXk">Unsplash</a></figcaption>
</figure>

That’s about it. Hope you got a decent idea and more importantly overcome your fear about TDD after completing this series. So, start using TDD before it’s too late, and don’t forget to have fun. Peace 👍
