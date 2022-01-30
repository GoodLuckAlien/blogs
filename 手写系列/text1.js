let arr = [
    16670,
    4769,
    2551,
    3536,
    2295,
    2045,
    2925,
    1916,
    323,
    5167,
    639,
    1680,
    1104,
    3048,
    2583,
    1454,
    2599,
    1694,
    1471,
    3450
  ];
  const queue = []
  arr = arr.map(
    (v, i) =>
      new Promise((res, rej) => {
         function cb (){
            setTimeout(() => {
                res([i, v]);
            }, v);
         }
         queue.push(cb)
      })
  );
  // 控制promise 并发,  返回结果类似 Promise.all
  const parallelFetch = (fetchs, limit = 5) =>
    new Promise((res, rej) => {
      const len = fetchs.length;
      const result = Array(len).fill(NaN);
      let count = 0;
      let t0 = +new Date();

      while (count < limit) next();

      function next() {
        let cur = count++;
        if (count >= len) {
          if (!result.includes(NaN)) res(result);
          return;
        }
        if (!fetchs[cur].t) fetchs[cur].t = +new Date();
        const cb = queue.shift()
        cb &&  cb()
        console.log(`--开始--  ${cur}`, fetchs[cur].t);

        fetchs[cur]
          .then((r) => {
            console.log(
              `--完成--  ${cur}`,
              fetchs[r[0]].t,
              +new Date() - fetchs[r[0]].t
            );
            result[cur] = r;
          })
          .catch((r) => {
            result[cur] = r;
          })
          .finally((_) => {
            if (cur < len) next();
          });
      }
    });

  parallelFetch(arr, 3)
    .then((r) => {
      console.log(r);
    })
    .catch((e) => {
      console.log(e);
    });

