import { useEffect, useState } from 'react';

// 擴展怪獸類型，加入帕魯特有的屬性
type Monster = {
  id: string;
  name: string;
  type: string;
  elementType?: 'fire' | 'water' | 'grass' | 'electric' | 'dark' | 'neutral'; // 帕魯元素類型
  maxHp: number;
  hp: number;
  moves: string[];
  level: number;
  x?: number;
  y?: number;
  isWild?: boolean;
  isPlayer?: boolean;
  // 帕魯特有屬性
  workability?: number; // 工作能力值 (0-100)
  specialSkill?: string; // 特殊技能
};

type Player = {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
};

// 怪獸模板 - 融合寶可夢和帕魯元素
const monsterTemplates = [
  {
    name: '花花獸',
    type: '草',
    elementType: 'grass',
    maxHp: 20,
    moves: ['藤鞭', '種子炸彈', '光合作用'],
    level: 5,
    workability: 65,
    specialSkill: '農耕',
  },
  {
    name: '火龍獸',
    type: '火',
    elementType: 'fire',
    maxHp: 18,
    moves: ['火花', '烈焰衝擊', '溫暖之體'],
    level: 5,
    workability: 70,
    specialSkill: '冶煉',
  },
  {
    name: '水水獸',
    type: '水',
    elementType: 'water',
    maxHp: 22,
    moves: ['水槍', '泡沫', '潛水'],
    level: 5,
    workability: 60,
    specialSkill: '釣魚',
  },
  // 帕魯特有生物
  {
    name: '帕魯貓',
    type: '一般',
    elementType: 'neutral',
    maxHp: 25,
    moves: ['撲擊', '挖掘', '萌態'],
    level: 5,
    workability: 85,
    specialSkill: '挖掘',
  },
];

const GameBoyPokemon = () => {
  const [gameState, setGameState] = useState<'title' | 'world' | 'battle' | 'menu'>('title');
  const [player, setPlayer] = useState<Player>({ x: 5, y: 5, direction: 'down' });
  const [allMonsters, setAllMonsters] = useState<Monster[]>([]);
  const [playerMonsters, setPlayerMonsters] = useState<Monster[]>([]);
  const [activeBattleId, setActiveBattleId] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy'>('player');
  const [message, setMessage] = useState<string>('歡迎來到帕魯生物世界！');
  const [debugMode] = useState<boolean>(true);
  const [canCapture, setCanCapture] = useState(false); // 戰鬥中是否可以捕捉

  // 初始化遊戲
  useEffect(() => {
    // 怪獸模板 - 融合寶可夢和帕魯元素

    // 為玩家創建初始怪獸
    const starterTemplate = monsterTemplates[Math.floor(Math.random() * 3)]; // 只從前三個基本寵物中選擇
    const playerMonster: Monster = {
      id: 'player-1',
      name: starterTemplate.name,
      type: starterTemplate.type,
      elementType: starterTemplate.elementType as 'fire' | 'water' | 'grass' | 'electric' | 'dark' | 'neutral',
      maxHp: starterTemplate.maxHp,
      hp: starterTemplate.maxHp,
      moves: [...starterTemplate.moves],
      level: starterTemplate.level,
      isPlayer: true,
      workability: starterTemplate.workability,
      specialSkill: starterTemplate.specialSkill,
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
        elementType: template.elementType as 'fire' | 'water' | 'grass' | 'electric' | 'dark' | 'neutral',
        maxHp: template.maxHp,
        hp: template.maxHp,
        moves: [...template.moves],
        level: template.level,
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
        isWild: true,
        workability: template.workability,
        specialSkill: template.specialSkill,
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
      setMessage('使用方向鍵移動，尋找帕魯生物！A鍵進入菜單，B鍵在戰鬥中逃跑或嘗試捕捉');
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
          setMessage('恭喜你！你已經擊敗或捕捉了所有的帕魯生物！');
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
            // 根據情況決定是嘗試捕捉還是逃跑
            if (canCapture) {
              attemptCapture();
            } else {
              attemptEscape();
            }
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

    // 判斷是否可以捕捉
    const captureAllowed = monster.hp / monster.maxHp < 0.7; // HP低於70%時可以嘗試捕捉
    setCanCapture(captureAllowed);

    if (debugMode) {
      console.log(`開始戰鬥，怪獸ID: ${monsterId}, HP: ${monster.hp}/${monster.maxHp}, 可捕捉: ${captureAllowed}`);
    }
  };

  // 玩家攻擊
  const playerAttack = () => {
    const playerMonster = playerMonsters[0];
    const enemyMonster = getBattleMonster();

    if (!enemyMonster) return;

    // 選擇招式 (此處隨機選擇)
    const moveIndex = Math.floor(Math.random() * playerMonster.moves.length);
    const selectedMove = playerMonster.moves[moveIndex];

    // 計算傷害 (考慮屬性相克)
    let damage = Math.floor(2 + Math.random() * 3);
    // 帕魯特有的屬性相克系統
    if (playerMonster.elementType && enemyMonster.elementType) {
      if (
        (playerMonster.elementType === 'fire' && enemyMonster.elementType === 'grass') ||
        (playerMonster.elementType === 'water' && enemyMonster.elementType === 'fire') ||
        (playerMonster.elementType === 'grass' && enemyMonster.elementType === 'water') ||
        (playerMonster.elementType === 'electric' && enemyMonster.elementType === 'water')
      ) {
        damage = Math.floor(damage * 1.5);
        setMessage(`效果拔群！${playerMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
      } else if (
        (playerMonster.elementType === 'grass' && enemyMonster.elementType === 'fire') ||
        (playerMonster.elementType === 'fire' && enemyMonster.elementType === 'water') ||
        (playerMonster.elementType === 'water' && enemyMonster.elementType === 'grass')
      ) {
        damage = Math.floor(damage * 0.5);
        setMessage(`效果不太好...${playerMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
      } else {
        setMessage(`${playerMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
      }
    } else {
      setMessage(`${playerMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
    }

    const newEnemyHp = Math.max(0, enemyMonster.hp - damage);

    // 更新怪獸HP
    updateMonsterState(enemyMonster.id, { hp: newEnemyHp });

    // 更新捕捉狀態
    const captureAllowed = newEnemyHp / enemyMonster.maxHp < 0.7;
    setCanCapture(captureAllowed);

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

    // 選擇招式
    const moveIndex = Math.floor(Math.random() * enemyMonster.moves.length);
    const selectedMove = enemyMonster.moves[moveIndex];

    // 計算傷害
    let damage = Math.floor(1 + Math.random() * 3);

    // 屬性相克系統
    if (enemyMonster.elementType && playerMonster.elementType) {
      if (
        (enemyMonster.elementType === 'fire' && playerMonster.elementType === 'grass') ||
        (enemyMonster.elementType === 'water' && playerMonster.elementType === 'fire') ||
        (enemyMonster.elementType === 'grass' && playerMonster.elementType === 'water') ||
        (enemyMonster.elementType === 'electric' && playerMonster.elementType === 'water')
      ) {
        damage = Math.floor(damage * 1.5);
        setMessage(`效果拔群！${enemyMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
      } else if (
        (enemyMonster.elementType === 'grass' && playerMonster.elementType === 'fire') ||
        (enemyMonster.elementType === 'fire' && playerMonster.elementType === 'water') ||
        (enemyMonster.elementType === 'water' && playerMonster.elementType === 'grass')
      ) {
        damage = Math.floor(damage * 0.5);
        setMessage(`效果不太好...${enemyMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
      } else {
        setMessage(`${enemyMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
      }
    } else {
      setMessage(`${enemyMonster.name}使用了${selectedMove}！造成${damage}點傷害！`);
    }

    const newPlayerHp = Math.max(0, playerMonster.hp - damage);

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

  // 嘗試捕捉怪獸
  const attemptCapture = () => {
    const enemyMonster = getBattleMonster();
    if (!enemyMonster) return;

    // 計算捕捉成功率
    const hpRatio = enemyMonster.hp / enemyMonster.maxHp;
    const captureRate = 0.8 * (1 - hpRatio); // HP越低越容易捕捉

    // 嘗試捕捉
    if (Math.random() < captureRate) {
      // 捕捉成功
      setMessage(`成功捕捉了 ${enemyMonster.name}！`);

      // 將怪獸加入玩家隊伍
      const capturedMonster: Monster = {
        ...enemyMonster,
        id: `player-${playerMonsters.length + 1}`,
        isWild: false,
        isPlayer: true,
        hp: Math.max(Math.floor(enemyMonster.maxHp / 2), 1), // 捕捉後HP為最大值的一半
      };

      // 從野生怪獸中移除
      setAllMonsters((prev) => prev.filter((m) => m.id !== enemyMonster.id));

      // 加入玩家隊伍
      setPlayerMonsters((prev) => [...prev, capturedMonster]);

      setTimeout(() => {
        setGameState('world');
        setMessage(`${enemyMonster.name} 加入了你的隊伍！`);
        // 捕捉成功後自動打開菜單展示新捕捉的怪獸
        setTimeout(() => {
          setGameState('menu');
        }, 1000);
      }, 1500);
    } else {
      // 捕捉失敗
      setMessage(`${enemyMonster.name} 掙脫了！`);
      setCurrentTurn('enemy');
      setTimeout(enemyAttack, 1000);
    }
  };

  // 獲取怪獸顏色
  // 獲取對應的帕魯圖片
  const getWildPalImage = (monster: Monster) => {
    switch (monster.elementType) {
      case 'fire':
        return 'pixel-fire-palu.svg';
      case 'water':
        return 'pixel-water-palu.svg';
      case 'grass':
        return 'pixel-grass-palu.svg';
      case 'electric':
        return 'pixel-electric-palu.svg';
      case 'dark':
        return 'pixel-night-palu.svg';
      default:
        return 'pixel-rock-palu.svg';
    }
  };

  // 保留原來的顏色函數用於其他地方
  // const getMonsterColor = (monster: Monster) => {
  //   switch (monster.elementType) {
  //     case 'fire':
  //       return 'bg-red-500';
  //     case 'water':
  //       return 'bg-blue-500';
  //     case 'grass':
  //       return 'bg-green-500';
  //     case 'electric':
  //       return 'bg-yellow-400';
  //     case 'dark':
  //       return 'bg-purple-800';
  //     default:
  //       return 'bg-gray-500';
  //   }
  // };

  // 獲取當前戰鬥中的怪獸（用於渲染）
  const currentBattleMonster = getBattleMonster();

  // 渲染遊戲畫面
  const renderGameScreen = () => {
    switch (gameState) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-2xl mb-4">帕魯生物冒險</div>
            <div className="mb-6">按任意鍵開始遊戲</div>
            <div className="text-sm">融合了寶可夢與幻獸帕魯的元素</div>
          </div>
        );

      case 'world':
        return (
          <div className="flex flex-col items-center">
            <div className="border-4 border-gray-800 bg-green-200 w-64 h-64 relative">
              {/* 玩家 */}
              <div
                className="absolute w-6 h-6 bg-blue-200 rounded-full"
                style={{
                  left: `${player.x * 24}px`,
                  top: `${player.y * 24}px`,
                }}
              >
                <img src="/pal/pixel-plush.svg" alt={playerMonsters[0].name} className="w-full h-full" />
              </div>

              {/* 怪獸 */}
              {allMonsters.map((monster) => (
                <div
                  key={monster.id}
                  className="absolute w-6 h-6 flex items-center justify-center"
                  style={{
                    left: `${(monster.x ?? 0) * 24}px`,
                    top: `${(monster.y ?? 0) * 24}px`,
                    opacity: monster.hp / monster.maxHp, // 怪獸HP越低，顯示越透明
                  }}
                >
                  <img src={`/pal/${getWildPalImage(monster)}`} alt={monster.name} className="w-full h-full" />
                  {monster.hp <= monster.maxHp / 2 && (
                    <div className="absolute text-xs font-bold text-yellow-300">!</div>
                  )}
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
                    <div className="w-16 h-16 mx-auto">
                      <img
                        src={`/pal/${getWildPalImage(currentBattleMonster)}`}
                        alt={currentBattleMonster.name}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="mt-2">
                      {currentBattleMonster.name}
                      <span className="text-xs ml-1">Lv.{currentBattleMonster.level}</span>
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
                  <div className="w-16 h-16 mx-auto">
                    <img
                      src={`/pal/${getWildPalImage(playerMonsters[0])}`}
                      alt={playerMonsters[0].name}
                      className="w-full h-full"
                    />
                  </div>
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

              {/* 戰鬥控制提示 */}
              <div className="absolute bottom-1 right-1 text-xs bg-white px-1 rounded">
                {canCapture ? 'B:捕捉' : 'B:逃跑'} | A:攻擊
              </div>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="flex flex-col items-center">
            <div className="border-4 border-gray-800 bg-white w-64 h-64 p-4 overflow-auto">
              <div className="text-xl mb-4">帕魯生物清單</div>
              <div className="max-h-40 overflow-y-auto mb-2 border-b-2 border-gray-200 pb-2">
                {playerMonsters.map((monster, index) => (
                  <div key={monster.id} className={`mb-3 p-2 ${index === 0 ? 'bg-blue-100 rounded' : ''}`}>
                    <div className="flex items-center">
                      <div className="w-6 h-6 mr-2">
                        <img
                          src={monster.isPlayer ? '/pal/pixel-plush.svg' : `/pal/${getWildPalImage(monster)}`}
                          alt={monster.name}
                          className="w-full h-full"
                        />
                      </div>
                      <span className="font-bold">
                        {index === 0 ? '➤ ' : ''}
                        {monster.name}
                      </span>
                      <span className="text-xs ml-2">Lv.{monster.level}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>
                        HP: {monster.hp}/{monster.maxHp}
                      </span>
                      <span>{monster.type}系</span>
                    </div>
                    <div className="text-xs mt-1">
                      <span className="mr-1">技能: {monster.specialSkill || '無'}</span>
                    </div>
                    <div className="text-xs mt-1">
                      <span>招式: {monster.moves.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm">
                <div>
                  <span className="font-bold">帕魯總數:</span> {playerMonsters.length}
                </div>
                <div>
                  <span className="font-bold">剩餘野生帕魯:</span> {allMonsters.length}
                </div>
                <div className="text-xs mt-1 text-gray-600">使用主要帕魯: {playerMonsters[0]?.name}</div>
              </div>
              <div className="mt-3 p-2 bg-gray-100 text-center rounded text-sm">按B返回遊戲</div>
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
