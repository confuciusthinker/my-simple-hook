/**
 * 细粒度实现 react hook
 */
(function() {
    //useState useEffect的发布订阅模式
    
    const effectStack = [];
    function useState(value) {
        //保存订阅该state变化的effect
        const subs = new Set();
        
        //value形成闭包
        const getter = () => {
            //获取当前上下文的effect (因为effect每次执行完就出栈，所以当前最顶端的effect就是当前上下文)
            const effect = effectStack[effectStack.length - 1];
            if (effect) {
                //建立发布订阅关系
                subscribe(effect, subs);
            }
            return value;
        };
        const setter = (newValue) => {
            value = newValue;
            //通知所有订阅该state的effect执行
            for (const effect of [...subs]) {
                effect.execute();
            }
        };

        return [getter, setter];
    }

    function subscribe(effect, subs) {
        //订阅关系建立
        subs.add(effect);
        //依赖关系建立
        effect.deps.add(subs);
    }

    function cleanup(effect) {
        //从该effect订阅的所有state对应的subs中移除该effect
        for (const subs of effect.deps) {
            subs.delete(effect);
        }
        //将该effect依赖的所有state对应的subs移除
        effect.deps.clear();
    }
    
    function useEffect(callback) {
        const execute = () => {
            //重置依赖 (setShowAll为false后，name2和effect已经不存在订阅关系，实现了“自动追踪”的能力)
            cleanup(effect);
            //将当前的effect推入栈顶
            effectStack.push(effect);
            try {
                //执行回调
                callback();
            } catch (error) {
                console.error(error);   
            } finally {
                //effect出栈
                effectStack.pop();
            }
        };

        const effect = {
            execute,
            deps: new Set(),
        };

        //立即执行一次，建立发布订阅关系
        execute();
    }

    function useMemo(callback) {
        const [s, set] = useState();
        //首次执行callback，建立回调中state的发布订阅关系
        useEffect(() => set(callback()));
        return s; 
    }

    const [name1, setName1] = useState('LiLei');
    const [name2, setName2] = useState('HanMeiMei');
    const [showAll, setShowAll] = useState(true);

    const whoIsHere = useMemo(() => {
        if (!showAll) return name1();
        return `${name1()} 和 ${name2()}`;
    });

    //谁在那！LiLei 和 HanMeiMei
    useEffect(() => console.log('谁在那！', whoIsHere()));

    //谁在那！LiLei 和 HanMeiMei
    setName1('XiaoMing');

    //谁在那！XiaoMiang
    setShowAll(false);

    //不打印信息
    setName2('XiaoHong');
})();