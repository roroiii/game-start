import { useEffect, useState } from 'react';

type Monster = {
  id: string;
  name: string;
  type: string;
  maxHp: number;
  hp: number;
  moves: string[];
  level: number;
  x?: number;
  y?: number;
  isWild?: boolean;
  isPlayer?: boolean;
};

type Player = {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
};

const GameBoyPokemon = () => {
  const [gameState, setGameState] = useState<'title' | 'world' | 'battle' | 'menu'>('title');
  const [player, setPlayer] = useState<Player>({ x: 5, y: 5, direction: 'down' });
  const [allMonsters, setAllMonsters] = useState<Monster[]>([]); // 存儲所有怪獸的全局狀態
  const [playerMonsters, setPlayerMonsters] = useState<Monster[]>([]);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null); // 存儲當前戰鬥的怪獸ID
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('player'); // 戰鬥中的當前回合
  const [message, setMessage] = useState<string>('歡迎來到寶可生物世界！');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [debugMode, setDebugMode] = useState<boolean>(true); // 調試模式

  // 初始化遊戲
  useEffect(() => {
    // 怪獸模板
    const monsterTemplates = [
      { name: '花花獸', type: '草', maxHp: 20, moves: ['藤鞭', '種子炸彈'], level: 5 },
      { name: '火龍獸', type: '火', maxHp: 18, moves: ['火花', '烈焰衝擊'], level: 5 },
      { name: '水水獸', type: '水', maxHp: 22, moves: ['水槍', '泡沫'], level: 5 },
    ];

    // 為玩家創建初始怪獸
    const starterTemplate = monsterTemplates[Math.floor(Math.random() * monsterTemplates.length)];
    const playerMonster = {
      id: 'player-1',
      name: starterTemplate.name,
      type: starterTemplate.type,
      maxHp: starterTemplate.maxHp,
      hp: starterTemplate.maxHp,
      moves: [...starterTemplate.moves],
      level: starterTemplate.level,
      isPlayer: true,
    };

    setPlayerMonsters([playerMonster]);

    // 創建野生怪獸
    const wildMonsters = [];
    for (let i = 0; i < 5; i++) {
      const template = monsterTemplates[Math.floor(Math.random() * monsterTemplates.length)];
      wildMonsters.push({
        id: `wild-${i}`,
        name: template.name,
        type: template.type,
        maxHp: template.maxHp,
        hp: template.maxHp,
        moves: [...template.moves],
        level: template.level,
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
        isWild: true,
      });
    }

    setAllMonsters(wildMonsters);

    if (debugMode) {
      console.log('遊戲初始化完成, 野生怪獸:', wildMonsters);
    }
  }, [debugMode]);

  // 獲取當前戰鬥中的怪獸
  const getBattleMonster = () => {
    return allMonsters.find((monster) => monster.id === activeBattleId);
  };

  // 更新怪獸狀態的輔助函數
  const updateMonsterState = (monsterId: string, updates: Partial<Monster>) => {
    setAllMonsters((prevMonsters) =>
      prevMonsters.map((monster) => (monster.id === monsterId ? { ...monster, ...updates } : monster))
    );

    if (debugMode) {
      console.log(`更新怪獸 ${monsterId} 的狀態:`, updates);
    }
  };

  // 處理鍵盤輸入
  const handleKeyPress = (key: string) => {
    if (gameState === 'title') {
      setGameState('world');
      setMessage('使用方向鍵移動，尋找怪獸！A鍵進入菜單，B鍵在戰鬥中逃跑');
      return;
    }

    if (gameState === 'world') {
      let newX = player.x;
      let newY = player.y;
      let direction = player.direction;

      switch (key) {
        case 'up':
          newY = Math.max(0, player.y - 1);
          direction = 'up';
          break;
        case 'down':
          newY = Math.min(9, player.y + 1);
          direction = 'down';
          break;
        case 'left':
          newX = Math.max(0, player.x - 1);
          direction = 'left';
          break;
        case 'right':
          newX = Math.min(9, player.x + 1);
          direction = 'right';
          break;
        case 'a':
          setGameState('menu');
          return;
        default:
          break;
      }

      // 檢查是否與怪獸相遇
      const encounteredMonster = allMonsters.find((m) => m.x === newX && m.y === newY);

      if (encounteredMonster) {
        // 開始戰鬥
        startBattle(encounteredMonster.id);
      } else {
        // 移動玩家
        setPlayer({ x: newX, y: newY, direction });

        // 檢查是否還有怪獸
        if (allMonsters.length === 0) {
          setMessage('恭喜你！你已經擊敗了所有的野生怪獸！');
          return;
        }

        // 隨機遇到怪獸 (10%機率)
        if (Math.random() < 0.1 && allMonsters.length > 0) {
          const randomMonster = allMonsters[Math.floor(Math.random() * allMonsters.length)];
          startBattle(randomMonster.id);
        }
      }
    }

    if (gameState === 'battle') {
      if (currentTurn === 'player') {
        switch (key) {
          case 'a':
            // 攻擊
            playerAttack();
            break;
          case 'b':
            // 嘗試逃跑
            attemptEscape();
            break;
          default:
            break;
        }
      }
    }

    if (gameState === 'menu') {
      if (key === 'b') {
        setGameState('world');
      }
    }
  };

  // 開始戰鬥
  const startBattle = (monsterId: string) => {
    const monster = allMonsters.find((m) => m.id === monsterId);
    if (!monster) return;

    setActiveBattleId(monsterId);
    setCurrentTurn('player');
    setGameState('battle');
    setMessage(`野生的${monster.name}出現了！`);

    if (debugMode) {
      console.log(`開始戰鬥，怪獸ID: ${monsterId}, HP: ${monster.hp}/${monster.maxHp}`);
    }
  };

  // 玩家攻擊
  const playerAttack = () => {
    const playerMonster = playerMonsters[0];
    const enemyMonster = getBattleMonster();

    if (!enemyMonster) return;

    // 計算傷害
    const damage = Math.floor(2 + Math.random() * 3);
    const newEnemyHp = Math.max(0, enemyMonster.hp - damage);

    // 更新消息
    setMessage(`${playerMonster.name}使用了${playerMonster.moves[0]}！造成${damage}點傷害！`);

    // 更新怪獸HP
    updateMonsterState(enemyMonster.id, { hp: newEnemyHp });

    // 檢查怪獸是否被擊敗
    if (newEnemyHp <= 0) {
      monsterDefeated(enemyMonster.id);
    } else {
      // 切換到敵人回合
      setCurrentTurn('enemy');
      setTimeout(enemyAttack, 1000);
    }
  };

  // 敵人攻擊
  const enemyAttack = () => {
    const playerMonster = playerMonsters[0];
    const enemyMonster = getBattleMonster();

    if (!enemyMonster) return;

    // 計算傷害
    const damage = Math.floor(1 + Math.random() * 3);
    const newPlayerHp = Math.max(0, playerMonster.hp - damage);

    // 更新消息
    setMessage(`${enemyMonster.name}使用了${enemyMonster.moves[0]}！造成${damage}點傷害！`);

    // 更新玩家怪獸HP
    setPlayerMonsters([{ ...playerMonster, hp: newPlayerHp }]);

    if (debugMode) {
      console.log(`敵人攻擊: ${playerMonster.name} 的HP從 ${playerMonster.hp} 減少到 ${newPlayerHp}`);
    }

    // 檢查玩家怪獸是否被擊敗
    if (newPlayerHp <= 0) {
      setTimeout(() => {
        setMessage(`${playerMonster.name}倒下了！`);
        setTimeout(() => {
          // 重置玩家怪獸的HP
          setPlayerMonsters([{ ...playerMonster, hp: playerMonster.maxHp }]);
          setGameState('world');
          setMessage('你被送回了怪獸中心...');
        }, 1500);
      }, 1000);
    } else {
      // 切換回玩家回合
      setCurrentTurn('player');
    }
  };

  // 怪獸被擊敗
  const monsterDefeated = (monsterId: string) => {
    const defeatedMonster = allMonsters.find((m) => m.id === monsterId);

    if (!defeatedMonster) return;

    setTimeout(() => {
      setMessage(`${defeatedMonster.name}倒下了！獲得經驗值！`);

      // 從怪獸列表中移除
      setAllMonsters((prevMonsters) => prevMonsters.filter((m) => m.id !== monsterId));

      // 玩家怪獸升級
      const playerMonster = playerMonsters[0];
      const updatedPlayerMonster = {
        ...playerMonster,
        level: playerMonster.level + 1,
        maxHp: playerMonster.maxHp + 2,
        hp: playerMonster.maxHp + 2, // 升級時回復所有HP
      };

      setPlayerMonsters([updatedPlayerMonster]);

      setTimeout(() => {
        setGameState('world');
        setMessage(`${playerMonster.name}升級了！現在是等級${updatedPlayerMonster.level}！`);
      }, 1500);

      if (debugMode) {
        console.log(`怪獸被擊敗: ${monsterId} 已從遊戲中移除，剩餘怪獸: ${allMonsters.length - 1}`);
      }
    }, 1000);
  };

  // 嘗試逃跑
  const attemptEscape = () => {
    if (Math.random() < 0.5) {
      setActiveBattleId(null);
      setGameState('world');
      setMessage('成功逃跑！');
    } else {
      setMessage('無法逃跑！');
      setCurrentTurn('enemy');
      setTimeout(enemyAttack, 1000);
    }
  };

  // 獲取當前戰鬥中的怪獸（用於渲染）
  const currentBattleMonster = getBattleMonster();

  // 渲染遊戲畫面
  const renderGameScreen = () => {
    switch (gameState) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-2xl mb-4">寶可生物冒險</div>
            <div className="mb-6">按任意鍵開始遊戲</div>
          </div>
        );

      case 'world':
        return (
          <div className="flex flex-col items-center">
            <div className="border-4 border-gray-800 bg-green-200 w-64 h-64 relative">
              {/* 玩家 */}
              <div
                className="absolute w-6 h-6 bg-blue-500 rounded-full"
                style={{
                  left: `${player.x * 24}px`,
                  top: `${player.y * 24}px`,
                }}
              />

              {/* 怪獸 */}
              {allMonsters.map((monster) => (
                <div
                  key={monster.id}
                  className="absolute w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                  style={{
                    left: `${(monster.x ?? 0) * 24}px`,
                    top: `${(monster.y ?? 0) * 24}px`,
                    opacity: monster.hp / monster.maxHp, // 怪獸HP越低，顯示越透明
                  }}
                >
                  {monster.hp <= monster.maxHp / 2 ? '!' : ''}
                </div>
              ))}
            </div>
          </div>
        );

      case 'battle':
        return (
          <div className="flex flex-col items-center">
            <div className="border-4 border-gray-800 bg-yellow-100 w-64 h-64 flex flex-col">
              {/* 敵人 */}
              {currentBattleMonster && (
                <div className="h-1/2 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full mx-auto"></div>
                    <div className="mt-2">
                      {currentBattleMonster.name}
                      <span className="text-xs ml-1">({currentBattleMonster.id})</span>
                    </div>
                    <div className="mt-1">
                      HP: {currentBattleMonster.hp}/{currentBattleMonster.maxHp}
                      <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-2 bg-red-500 rounded-full"
                          style={{
                            width: `${(currentBattleMonster.hp / currentBattleMonster.maxHp) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 玩家 */}
              <div className="h-1/2 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto"></div>
                  <div className="mt-2">
                    {playerMonsters[0].name} Lv.{playerMonsters[0].level}
                  </div>
                  <div className="mt-1">
                    HP: {playerMonsters[0].hp}/{playerMonsters[0].maxHp}
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{
                          width: `${(playerMonsters[0].hp / playerMonsters[0].maxHp) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="flex flex-col items-center">
            <div className="border-4 border-gray-800 bg-white w-64 h-64 p-4">
              <div className="text-xl mb-4">菜單</div>
              <ul>
                <li className="mb-2">
                  <span className="font-bold">怪獸:</span> {playerMonsters[0].name}
                  (Lv.{playerMonsters[0].level}, HP:{playerMonsters[0].hp}/{playerMonsters[0].maxHp})
                </li>
                <li className="mb-2">
                  <span className="font-bold">招式:</span> {playerMonsters[0].moves.join(', ')}
                </li>
                <li className="mb-2">
                  <span className="font-bold">剩餘野生怪獸:</span> {allMonsters.length}
                </li>
                {debugMode && (
                  <li className="mb-2">
                    <span className="font-bold">怪獸狀態:</span>
                    <div className="text-xs mt-1">
                      {allMonsters.map((m) => (
                        <div key={m.id}>
                          {m.id}: {m.hp}/{m.maxHp}
                        </div>
                      ))}
                    </div>
                  </li>
                )}
              </ul>
              <div className="mt-4 p-2 bg-gray-100 text-center rounded">按B返回遊戲</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 font-mono">
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="bg-gray-800 p-1 rounded-lg">
          {/* 遊戲畫面 */}
          <div className="bg-gray-200 p-2 rounded">
            {renderGameScreen()}

            {/* 訊息顯示 */}
            <div className="mt-4 border-2 border-gray-800 bg-white p-2 h-16 flex items-center">
              <div>{message}</div>
            </div>
          </div>

          {/* 控制按鈕 */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div></div>
            <button className="bg-gray-400 h-10 rounded-full" onClick={() => handleKeyPress('up')}>
              ↑
            </button>
            <div></div>

            <button className="bg-gray-400 h-10 rounded-full" onClick={() => handleKeyPress('left')}>
              ←
            </button>
            <div></div>
            <button className="bg-gray-400 h-10 rounded-full" onClick={() => handleKeyPress('right')}>
              →
            </button>

            <div></div>
            <button className="bg-gray-400 h-10 rounded-full" onClick={() => handleKeyPress('down')}>
              ↓
            </button>
            <div></div>
          </div>

          <div className="mt-4 flex justify-center gap-8">
            <button className="bg-red-500 h-10 w-10 rounded-full text-white" onClick={() => handleKeyPress('b')}>
              B
            </button>
            <button className="bg-green-500 h-10 w-10 rounded-full text-white" onClick={() => handleKeyPress('a')}>
              A
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoyPokemon;
