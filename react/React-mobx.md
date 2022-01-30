## mobx  和 mobx-react
mobx 暴露出方法，里面 对于方法-action ，对于状态 observable

* 基础数据类型number/string：observable.box  
* object：observable.object
* array： observable.array

对于基础数据类型 ->  new ObservableValue
对于对象数据类型 ->  extendObservable( asObservableObject  )

### observable

**asObservableObject**
````js
export function asObservableObject(
    target: any,
    options?: CreateObservableOptions
): IIsObservableObject {

   /* 如果已经经过mobx处理过，那么直接 */
    if (hasProp(target, $mobx)) {
        return target
    }

    const name = 'ObservableObject'
    /* 构建响应式对象 */  
    const adm = new ObservableObjectAdministration(
        target,
        new Map(),
        String(name),
        getAnnotationFromOptions(options)
    )

    addHiddenProp(target, $mobx, adm)

    return target
}
````

**extendObservable**

````js

````


**ObservableObjectAdministration** 创建真正的observer对象。

````js
class ObservableObjectAdministration{
    get_(){}
    set_(){}
    defineProperty_(){}
    extend_(){}
}
````

### action

````js
function createActionFactory(autoAction: boolean): IActionFactory {
    const res: IActionFactory = function action(arg1, arg2?): any {
        // action(fn() {}) 情况
        if (isFunction(arg1))
            return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction)
        // action("name", fn() {}) 情况
        if (isFunction(arg2)) return createAction(arg1, arg2, autoAction)
        // @action 情况
        if (isStringish(arg2)) {

            return storeAnnotation(arg1, arg2, autoAction ? autoActionAnnotation : actionAnnotation)
        }
        // action("name") & @action("name") 情况
        if (isStringish(arg1)) {
            return createDecoratorAnnotation(
                createActionAnnotation(autoAction ? AUTOACTION : ACTION, {
                    name: arg1,
                    autoAction
                })
            )
        }
    } as IActionFactory
    return res
}
````

**storeAnnotation**

````js
export function storeAnnotation(prototype: any, key: PropertyKey, annotation: Annotation) {
    if (!hasProp(prototype, storedAnnotationsSymbol)) {
        addHiddenProp(prototype, storedAnnotationsSymbol, {
            // Inherit annotations
            ...prototype[storedAnnotationsSymbol]
        })
    }
    // Cannot re-decorate
    assertNotDecorated(prototype, annotation, key)

    // Ignore override
    if (!isOverride(annotation)) {
        prototype[storedAnnotationsSymbol][key] = annotation
    }
}
````
绑定在class类上。

mobx-React

provider inject observer

### Provider


### inject

````js
export function inject(/* fn(stores, nextProps) or ...storeNames */ ...storeNames: Array<any>) {
    if (typeof arguments[0] === "function") {
        let grabStoresFn = arguments[0]
        return (componentClass: React.ComponentClass<any, any>) =>
            createStoreInjector(grabStoresFn, componentClass, grabStoresFn.name, true)
    } else {
        /*  */
        return (componentClass: React.ComponentClass<any, any>) =>
            createStoreInjector(
                grabStoresByName(storeNames),
                componentClass,
                storeNames.join("-"),
                false
            )
    }
}
````

**createStoreInjector**

````js
function createStoreInjector(
    grabStoresFn: IStoresToProps,
    component: IReactComponent<any>,
    injectNames: string,
    makeReactive: boolean
): IReactComponent<any> {
    // Support forward refs
    let Injector: IReactComponent<any> = React.forwardRef((props, ref) => {
        const newProps = { ...props }
        const context = React.useContext(MobXProviderContext)
        Object.assign(newProps, grabStoresFn(context || {}, newProps) || {})

        if (ref) {
            newProps.ref = ref
        }

        return React.createElement(component, newProps)
    })

    if (makeReactive) Injector = observer(Injector)
    Injector["isMobxInjector"] = true // assigned late to suppress observer warning

    // Static fields from component should be visible on the generated Injector
    copyStaticProperties(component, Injector)
    Injector["wrappedComponent"] = component
    Injector.displayName = getInjectName(component, injectNames)
    return Injector
}
````


## 依赖收集流程

### observer

````js
function observer(){
       return makeClassComponentObserver(component as React.ComponentClass<any, any>) as T
}
````

**makeClassComponentObserver**

````js
function makeClassComponentObserver (){
       /* 将props 和 state */
    makeObservableProp(target, "props")
    makeObservableProp(target, "state")

    const baseRender = target.render
    target.render = function () {
        return makeComponentReactive.call(this, baseRender)
    }
}
````
**makeComponentReactive**

````js
/* render 我们真正的render 函数 */
function makeComponentReactive(render){
    const baseRender = render.bind(this)
    const reaction = new Reaction(`${initialName}.render()`, () => {
        if (!isRenderingPending) {
            isRenderingPending = true
            if (this[mobxIsUnmounted] !== true) {
                let hasError = true
                try {
                    setHiddenProp(this, isForcingUpdateKey, true)
                    if (!this[skipRenderKey]) Component.prototype.forceUpdate.call(this)
                    hasError = false
                } finally {
                    setHiddenProp(this, isForcingUpdateKey, false)
                    if (hasError) reaction.dispose()
                }
            }
        }
    })
    reaction["reactComponent"] = this
    reactiveRender[mobxAdminProperty] = reaction
    this.render = reactiveRender
    function reactiveRender() {
        isRenderingPending = false
        let exception = undefined
        let rendering = undefined
        // 这个有点模拟vue 中的 ，reaction.track，当执行render函数的时候，会通过React.createElement收集依赖，如何收到依赖，接下来会讲到。
        reaction.track(() => {
            try {
                rendering = _allowStateChanges(false, baseRender)
            } catch (e) {
                exception = e
            }
        })
        if (exception) {
            throw exception
        }
        return rendering
    }

    return reactiveRender.call(this)
}
````

**Reaction和reaction.track**

````js
/* 创建一个 Reaction */
class Reaction{
    name = null
    onInvalidate_ = null
    constructor(name_,onInvalidate_){
        this.name = name 
        this.onInvalidate_ = onInvalidate_
    }
    schedule_() {
        if (!this.isScheduled_) {
            this.isScheduled_ = true
            globalState.pendingReactions.push(this)
            runReactions()
        }
    }
    runReaction_() {
        if (!this.isDisposed_) {
            startBatch()
            this.isScheduled_ = false
            const prev = globalState.trackingContext
            globalState.trackingContext = this
            if (shouldCompute(this)) {
                this.isTrackPending_ = true
                try {
                    this.onInvalidate_()
                } catch (e) {
                    this.reportExceptionInDerivation_(e)
                }
            }
            globalState.trackingContext = prev
            endBatch()
        }
    }
    track(fn: () => void) {
        startBatch()
        this.isRunning_ = true
        const prevReaction = globalState.trackingContext
        globalState.trackingContext = this
        const result = trackDerivedFunction(this, fn, undefined)
        globalState.trackingContext = prevReaction
        this.isRunning_ = false
        this.isTrackPending_ = false
        if (this.isDisposed_) {
            clearObserving(this)
        }
        if (isCaughtException(result)) this.reportExceptionInDerivation_(result.cause)
        endBatch()
    }

}
````

* Reaction 可以认为是更新管理，
* 被observer对象包裹的组件，执行render方法，会内部调用 track 方法。
* onInvalidate_ 是更新组件的函数 Component.prototype.forceUpdate。

````js
globalState.trackingContext = this
const result = trackDerivedFunction(this, fn, undefined)
globalState.trackingContext = prevReaction
````

trackDerivedFunction 里面会执行 render函数，那么render函数的依赖，可以通过 trackingContext 赋值 -> 重置，达到目的。

mobx收集依赖，也是通过赋值-> 收集依赖 -> 重置，将进行收集，具体细节在 trackDerivedFunction 函数中。

**trackDerivedFunction**

````js
function trackDerivedFunction(){
    const prevAllowStateReads = allowStateReadsStart(true)
    changeDependenciesStateTo0(derivation)
    derivation.newObserving_ = new Array(derivation.observing_.length + 100)
    derivation.unboundDepsCount_ = 0
    derivation.runId_ = ++globalState.runId
    const prevTracking = globalState.trackingDerivation
    globalState.trackingDerivation = derivation
    globalState.inBatch++
    let result
    if (globalState.disableErrorBoundaries === true) {
        result = f.call(context)
    } else {
        try {
            result = f.call(context)
        } catch (e) {
            result = new CaughtException(e)
        }
    }
    globalState.inBatch--
    globalState.trackingDerivation = prevTracking
    bindDependencies(derivation)
    warnAboutDerivationWithoutDependencies(derivation)
    allowStateReadsEnd(prevAllowStateReads)
    return result
}
````

* derivation 用于真正的依赖收集。

````js
const prevTracking = globalState.trackingDerivation
globalState.trackingDerivation = derivation
result = f.call(context)
globalState.trackingDerivation = prevTracking
````

* f 为真正的render函数。

### 如果出发一次get

如果在 render 阶段，使用了mobx 的一个模块下的数据，比如  Root.number，那么在mobx底层会发生什么呢？在第一步的对应的obsever对象中，

会触发get方法。

````js
   get_(key) {
        /* 如果没有发起订阅，那么订阅当前的属性key */
        if (globalState.trackingDerivation && !hasProp(this.target_, key)) {
            this.has_(key)
        }
        return this.target_[key]
   }
    has_(key: PropertyKey): boolean {
        this.pendingKeys_ ||= new Map()
        let entry = this.pendingKeys_.get(key)
        if (!entry) {
            entry = new ObservableValue(
                key in this.target_,
                referenceEnhancer,
                "ObservableObject.key?",
                false
            )
            /* 和建立其关联 */
            this.pendingKeys_.set(key, entry)
        }
        return entry.get()
    } 
````
* 针对每一个收集的属性，如果在 render 函数中被引用，都会创建一个 Observable 。
* 比如Root中的number属性，可能会被多个页面使用，所以每个组件绑定属性，都要创建一个 ObservableValue 
* 然后调用 Observable.get() 进行真正的依赖收集。

````js
class ObservableValue{
    public set(newValue: T) {
        newValue = this.prepareNewValue_(newValue) as any
        if (newValue !== globalState.UNCHANGED) {
            this.setNewValue_(newValue)
        }
    }
    public get(): T {
        this.reportObserved()
        return this.dehanceValue(this.value_)
    }
    public reportObserved(): boolean {
        return reportObserved(this)
    }
}
````
ObservableValue 本质上调用 reportObserved。

````js

````






