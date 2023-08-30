const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECT = "reject";

const handlerPromise = (promise, v, resolve, reject) => {
  if (promise === v)
    return reject(
      new Error("TypeError: Chaining cycle detected for promise #<Promise>")
    ); // 解决情况一问题

  if ((typeof v === "object" && v !== null) || typeof v === "function") {
    try {
      let called = false;
      let then = v.then;
      if (typeof then === "function") {
        then.call(
          v,
          (y) => {
            if (called) {
              return;
            }
            called = true;
            handlerPromise(promise, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(v);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    resolve(v);
  }
};

class MyPromise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.onFulFilledCallback = [];
    this.onRejectCallback = [];
    const resolve = (value) => {
      setTimeout(() => {
        if (this.status === PENDING) {
          this.status = FULFILLED;
          this.value = value;
          this.onFulFilledCallback.forEach((item) => item(this.value));
        }
      });
    };
    const reject = (value) => {
      setTimeout(() => {
        if (this.status === PENDING) {
          this.status = REJECT;
          this.value = value;
          this.onRejectCallback.forEach((item) => item(this.value));
        }
      });
    };
    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : function (err) {
            throw err;
          };
    const myPromise = new MyPromise((resolve, reject) => {
      switch (this.status) {
        case FULFILLED:
          handlerPromise(myPromise, onFulfilled(this.value), resolve, reject);
          break;
        case REJECT:
          handlerPromise(myPromise, onRejected(this.value), resolve, reject);
          break;
        case PENDING:
          this.onFulFilledCallback.push(() => {
            handlerPromise(myPromise, onFulfilled(this.value), resolve, reject);
          });
          break;
      }
    });
    return myPromise;
  }
}

new MyPromise(function (resolve, reject) {
  setTimeout(() => {
    resolve("args");
  });
})
  .then(function (x) {
    console.log("then-1", x);
    return new MyPromise((resolve) => {
      resolve(1);
    }).then((v) => {
      console.log("then-1-child", v);
      return 10;
    });
  })
  .then(function (x) {
    console.log("then-2", x);
  });
