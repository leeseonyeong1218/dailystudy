# 선행 기록 웹사이트 - 전체 설정 안내서

이 안내서는 로컬에서 제작된 웹사이트를 GitHub Pages에 배포하고, Google Sheets와 연동하여 동적 웹 애플리케이션으로 완성하는 모든 과정을 설명합니다.

---
## 1단계: 웹사이트를 GitHub Pages에 배포하기

이 단계에서는 웹사이트 파일들(`index.html`, `styles.css` 등)을 인터넷에 공개하여 누구나 접속할 수 있는 주소를 만듭니다.

1.  **GitHub 저장소(Repository) 생성:**
    - [GitHub](https://github.com/)에 로그인한 후, `New repository` 버튼을 눌러 새 저장소를 만듭니다.
    - 저장소 이름을 정하고 `Public`으로 설정한 뒤 생성합니다.

2.  **프로젝트 파일 업로드(Push):**
    - 생성된 저장소의 안내에 따라, 로컬 컴퓨터에 있는 프로젝트 파일(`index.html`, `styles.css`, `script.js` 등)을 모두 업로드(push)합니다.

3.  **GitHub Pages 활성화:**
    - 업로드한 저장소 페이지에서 `Settings` 탭으로 이동합니다.
    - 왼쪽 메뉴에서 `Pages`를 클릭합니다.
    - `Source` 항목에서 브랜치를 `main` (또는 코드를 올린 브랜치)으로 선택하고 `Save` 버튼을 누릅니다.

4.  **웹사이트 주소 확인:**
    - 잠시 후 페이지 상단에 "Your site is live at `https://사용자이름.github.io/저장소이름/`" 메시지가 표시됩니다.
    - 이 주소가 내 웹사이트의 최종 주소입니다. 다음 단계를 위해 이 주소를 기억해 둡니다.

---

## 2단계: Google Sheet 데이터베이스 준비
https://sheets.new
1.  **새 Google Sheet 생성:**
    - [Google Sheets]()로 이동하여 새 스프레드시트를 생성하고, "서비스제목" 등으로 이름을 지정합니다.

2.  **스프레드시트 ID 복사:**
    - 브라우저 주소창의 URL에서 `.../d/` 와 `/edit` 사이의 긴 문자열(스프레드시트 ID)을 복사하여 보관합니다.
    - 예: `.../d/1a2b3c4d5e6f7g8h9i0j.../edit` -> `1a2b3c4d5e6f7g8h9i0j...`가 ID입니다.

---

## 3단계: Google Apps Script 설정 및 배포

Google Sheet와 웹사이트를 연결해 줄 API 서버를 만드는 과정입니다.

1.  **Apps Script 편집기 열기:**
    - 2단계에서 만든 Google Sheet에서 `확장 프로그램` > `Apps Script`를 클릭합니다.

2.  **스크립트 코드 붙여넣기:**
    - `Code.gs` 파일의 내용을 모두 지우고, 이 프로젝트의 `google-apps-script.gs` 파일 전체 코드를 복사하여 붙여넣습니다.

3.  **스프레드시트 ID 입력:**
    - 붙여넣은 코드 상단의 `YOUR_SPREADSHEET_ID_HERE` 부분을 2단계에서 복사한 **자신의 스프레드시트 ID**로 **두 군데 모두** 교체합니다.

4.  **`appsscript.json` 수정 (권한 명시):**
    - 왼쪽 메뉴의 `프로젝트 설정`(⚙️)을 클릭하여 "편집기에서 'appsscript.json' 매니페스트 파일 표시" 체크박스를 선택합니다.
    - 다시 `편집기`(<> )로 돌아와 `appsscript.json` 파일을 엽니다.
    - 파일 내용을 모두 지우고 아래 내용으로 완전히 교체 후 저장(💾)합니다.
      
      {
        "timeZone": "Asia/Seoul",
        "dependencies": {},
        "exceptionLogging": "STACKDRIVER",
        "runtimeVersion": "V8",
        "oauthScopes": [
          "https://www.googleapis.com/auth/spreadsheets"
        ]
      }
 

5.  **웹 앱으로 배포 및 권한 승인:**
    - 우측 상단의 `배포` > `새 배포`를 클릭합니다.
    - **액세스 권한이 있는 사용자**를 **`모든 사용자`**로 설정하고 `배포`를 클릭합니다.
    - 스크립트가 스프레드시트 권한을 요청할 때, `액세스 승인`을 누르고 본인 계정을 선택하여 모든 권한을 **허용**합니다. (안전하지 않다는 경고가 나와도 `고급` > `이동`을 눌러 진행)

6.  **웹 앱 URL 복사:**
    - 배포가 완료되면 표시되는 **웹 앱 URL**을 복사합니다. 이것이 내 API 서버의 주소입니다.

> **잠깐! `appsscript.json` 파일은 왜 수정해야 하나요?**
> 과거에는 Apps Script가 코드를 보고 필요한 권한을 자동으로 추측했지만, 현재는 보안과 안정성을 위해 **필요한 권한을 직접 명시해주는 것이 표준 방식**입니다. 특히 "모든 사용자"에게 공개되는 웹 앱의 경우, `"https://www.googleapis.com/auth/spreadsheets"` 권한을 명시해야 스크립트가 안정적으로 스프레드시트에 접근할 수 있습니다.

---
** 앱스크립트 변동생기면 : "배포 관리" → 연필 아이콘 → "새 버전" → "배포" 클릭 (url수정없음)

## 4단계: 웹사이트와 API 서버 연결

1.  **`script.js` 파일 수정:**
    - 로컬 컴퓨터의 `script.js` 파일을 엽니다.
    - 파일 상단의 `YOUR_GOOGLE_APPS_SCRIPT_URL_HERE` 부분을 **3단계에서 복사한 새 웹 앱 URL**로 교체합니다. 

2.  **최종 파일 업로드:**
    - `script.js` 파일을 저장하고, 변경된 파일을 **GitHub 저장소에 다시 업로드(push)**합니다.

3.  **완료!**
    - 1~2분 후, 1단계에서 만든 나의 GitHub Pages 웹사이트 주소로 접속하면 모든 기능이 정상적으로 작동하는 것을 확인할 수 있습니다.
