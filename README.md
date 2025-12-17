# Gemini Live Translator (AI 동시통역기)

Google Gemini API와 Web Speech API를 활용한 실시간 음성 번역 웹 애플리케이션입니다.  
한국어(Host)와 외국어(Guest)를 사용하는 두 화자 간의 대화를 실시간으로 통역하고 기록합니다.

## ✨ 주요 기능

* **실시간 양방향 통역**: 한국어 ↔ 영어/러시아어 등 (Gemini AI 기반)
* **통합 채팅 UI**: 카카오톡/WhatsApp 스타일의 직관적인 대화창
* **듀얼 마이크 시스템**: 화자별 전용 버튼으로 빠르고 정확한 인식
* **키보드 단축키 지원**: 마우스 없이 키보드만으로 마이크 제어 (←, →, Space)
* **회의록 저장**: 브라우저 자동 저장, JSON 다운로드, Supabase 클라우드 동기화 지원
* **다양한 플랫폼 지원**: 웹 앱, 크롬 확장프로그램, 옵시디언 플러그인

---

## 🚀 설치 및 사용 방법 (3가지 모드)

이 프로젝트는 소스 코드 형태로 제공되며, 사용자의 컴퓨터(로컬)에서 실행됩니다.

### 1. 기본 웹 앱 (Web App)

가장 안정적이고 기능이 온전한 모드입니다.

1. 프로젝트 폴더에서 터미널을 엽니다.
2. `npm install` (최초 1회, 의존성 설치)
3. `npm run dev` 명령어로 실행합니다.
4. 브라우저에서 `http://localhost:5173` 접속.
5. **설정(Settings)**에서 Gemini API Key를 입력하고 사용 시작.

### 2. 크롬 확장프로그램 (Chrome Extension)

다른 웹사이트를 보면서 사이드바에서 통역기를 쓸 수 있습니다.

1. 프로젝트 폴더에서 `npm run build`를 실행하여 `dist` 폴더를 생성합니다.
2. 크롬 주소창에 `chrome://extensions` 입력.
3. 우측 상단 **[개발자 모드]** 켜기.
4. **[압축해제된 확장 프로그램을 로드합니다]** 클릭.
5. 프로젝트 내 `dist` 폴더를 선택.
6. 크롬 툴바에서 퍼즐 아이콘을 눌러 고정하고 클릭하여 실행.

### 3. 옵시디언 플러그인 (Obsidian Plugin)

옵시디언 노트 앱 내에서 바로 통역기를 띄웁니다.

1. `obsidian-plugin` 폴더 전체를 복사합니다.
2. 내 옵시디언 볼트(Vault) 폴더의 `.obsidian/plugins/` 경로에 붙여넣습니다. (폴더명: `gemini-live-translator`)
3. 옵시디언 **Settings > Community Plugins**에서 **Turn on** 후 플러그인 활성화.
4. 리본 메뉴의 지구본 아이콘(🌐) 클릭.

---

## ⌨️ 키보드 단축키 (웹 앱 전용)

마우스 클릭 없이 편하게 대화하세요.

* `←` (왼쪽 화살표) 또는 `1`: **왼쪽 마이크 (내 언어) 켜기**
* `→` (오른쪽 화살표) 또는 `2`: **오른쪽 마이크 (상대 언어) 켜기**
* `Space` (스페이스바): **마이크 끄기 / 켜기**

---

## 🛠️ 기술 스택

* **Frontend**: React, Vite
* **AI**: Google Gemini Pro / Flash (via Generative AI SDK)
* **Speech**: Web Speech API (webkitSpeechRecognition)
* **Styles**: Pure CSS (Dark Mode)
* **Storage**: LocalStorage & Supabase (Optional)
