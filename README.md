# ✨ JS Anims
JS class i often use as base to extend and make some reusable animations as modules. 

![image](https://github.com/DamChtlv/js-anim-base/assets/6544224/11dccdb0-2de2-4fc2-8221-91e86cdcc472)

## 🛠 Features
- **Properties**: `breakpoints, isMobile, isTablet, isDesktop...`
- **Helpers**: `lerp, debounce, throttle...`
- **Modules**: _Global intersection observer, extensible [(see below)](https://github.com/DamChtlv/js-anim-base/tree/main/README.md#new-module)..._
- **Events built-in**: `init, ready, load, resize, scroll, isVisible, isNotVisible...`
- **Auto lib checker**: _Give an error log when a module require a specific library which isn't loaded in the DOM_
- **Auto check element in viewport**: _`isVisible()` and `isNotVisible()` will be called when your observed elements enter / leaves viewport_

## 👀 Debug
Use `this.log('Your log content', data)` from within your module code to display your log **when debug mode is active** _(see below)_ ⬇
- **Simple mode**: Use `?debug` in the URL to get all logs and use `?debug=module-name` to get specific log related to your module.
- **Advanced mode**: Use `?debughard` in the URL to get all logs + related data / elements and use `?debughard=module-name` to get specific logs related to your module.

## ↪ New module
1. Create a **new JavaScript class** which **extend** `DC_AnimBase`
2. Use a string as argument in `super()` callback inside the constructor, ex: 
```js
class MagneticButton extends DC_AnimBase {
    constructor() {
        super('magnetic-button')
    }
}
```
3. **To set some specific properties for your module**, use `setProperties()` method and call `super.setProperties();` to inherit parent properties.  
Inside this method, you can set some **requirements** / **lib dependencies** with `this.libs` array property _(ex: `this.libs.push('Splide')`)_  
You can also set which elements should be **observed** using `this.observedEls` array property and  
the **2 methods**: `isVisible()` / `isNotVisible()` will be called from **within your module code**.
See [Module template](https://github.com/DamChtlv/js-anim-base/tree/main/README.md#module-template) for a clear example.

## © Module template
```
// Anim module class
class DC_AnimTemplate extends DC_AnimBase {

    // Set the module slug below
    constructor() {
      super('anim-template')
    }

    // 0. Set / update properties
    setProperties() {

        // Set back parent properties first
        super.setProperties();

        // (uncomment below if needed)
        //this.libs.push('')
        //this.observedEls = [ ...document.querySelectorAll('h2') ]
    }

    // 1. Execute code as soon as possible
    onInit() {
      // Your code ...
    }

    // 2. Execute code when DOM is ready
    onReady() {
      // Your code ...
    }
    
    // 3. Execute code when DOM is totally loaded
    onLoad() {
      // Your code ...
    }
    
    // 4. Execute code when window is resized (event is already throttled for perf)
    onResize(ev) {
      // Your code ...
    }
    
    // 5. Execute code when scrolled (event is already debounced for perf)
    onScroll(ev) {
      // Your code ...
    }

    // 6. Execute code when an element enter the viewport
    isVisible(el) {
      // Your code ...
    }

    // 7. Execute code when an element leave the viewport
    isNotVisible(el) {
      // Your code ...
    }

}

new DC_AnimTemplate();
```
