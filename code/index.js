(function() {
    console.log('hook is start!');

    // 是否是初次调用
    let isMount = true;
    // 指针-指向当前正在工作的hooks
    let workInProgressHook = null;

    // function component对应的fiber
    const fiber = {
        // 以链表的形式用于保存hooks，而hook这种数据结构用来保存update
        memoizedState: null,
        // 保存对应的function
        stateNode: App,
    };

    /**
     * 用于模拟schedule - render - commit
     * @returns 
     */
    function run() {
        // hooks的初始化操作
        workInProgressHook = fiber.memoizedState;
        const app = fiber.stateNode();
        isMount = false;
        return app;
    }

    /**
     * 创建update，形成环状链表
     * @param {*} queue 
     * @param {*} action 
     */
    function dispathAction(queue, action) {
        const update = {
            action,
            next: null,
        };

        // 之前没有update，创建环形链表，指向自己
        if (queue.pending === null) {
            update.next = update;
        } else {
            // 之前有update，进行环形链表的尾部插入操作
            // before: 3 -> 0 -> 1 -> 2 -> 3
            // after:  4 -> 0 -> 1 -> 2 -> 3 -> 4
            update.next = queue.pending.next;
            queue.pending.next = update;
        }
        queue.pending = update;

        run();
    }

    /**
     * newState = baseState + update
     * useState会进行state的计算过程，返回的updateNum方法会创建update
     * @param {*} initialState 
     * @returns 
     */
    function useState(initialState) {
        let hook;

        if (isMount) {
            hook = {
                // 新加入的update，形成环形链表
                queue: {
                    // pending指向最后一个update
                    pending: null,
                },
                // hook的state
                memoizedState: initialState,
                // 指针-指向下一个hook
                next: null,
            };

            // 多次调用useState时，会形成hook的单链表
            if (!fiber.memoizedState) {
                fiber.memoizedState = hook;
            } else {
                workInProgressHook.next = hook;
            }
            workInProgressHook = hook;
        } else {
            // 更新的时候只需要拿到当前的hook，并将指针指向下一个
            hook = workInProgressHook;
            workInProgressHook = workInProgressHook.next;
        }

        let baseState = hook.memoizedState;
        // 说明有更新要处理
        if (hook.queue.pending) {
            let firstUpdate = hook.queue.pending.next;
            // 遍历update队列进行newState的计算
            do {
                // action就是调用updateNum的参数，这里仅考虑传入function的情况
                const action = firstUpdate.action;
                baseState = action(baseState);
                firstUpdate = firstUpdate.next;
            } while (firstUpdate !== hook.queue.pending.next);

            hook.queue.pending = null;
        }

        hook.memoizedState = baseState;

        return [baseState, dispathAction.bind(null, hook.queue)];
    }

    function App() {
        const [num, updateNum] = useState(0);
        const [status, tiggerStatus] = useState(false);

        console.log('isMount', isMount);

        console.log('num', num);
        console.log('status', status);
        
        return {
            onClick() {
                updateNum(num => num + 1);
            },
            tiggerStatus() {
                tiggerStatus(status => !status);
            }
        };
    };

    window.app = run();
})();