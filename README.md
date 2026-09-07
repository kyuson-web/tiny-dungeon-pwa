# Tiny Dungeon 迷宮勇者

純 JavaScript + Canvas 2D 回合制 RPG（零框架、零圖片、離線 PWA）。

## 本地运行
```
python3 -m http.server 8000
```
開 http://localhost:8000（唔好用 file:// 直接開，Service Worker 需要 http）。

## 部署
全部檔案傳上 GitHub repo → Settings → Pages → main / (root)。

## 規格
- game.js 剛好 16231 bytes（由打包腳本校準）
- 操作：WASD/方向鍵移動，戰鬥按 1-4，詳細見遊戲內提示
