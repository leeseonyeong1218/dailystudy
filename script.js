document.addEventListener('DOMContentLoaded', () => {
  // !!! 중요: 배포된 자신의 Google Apps Script 웹 앱 URL로 변경하세요.
  const WEB_APP_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

  const recordForm = document.getElementById('record-form');
  const recordsContainer = document.getElementById('records-container');
  const dateInput = document.getElementById('date');
  const exportButton = document.getElementById('export-excel');
  const moodChartCanvas = document.getElementById('mood-chart');

  let recordsCache = []; // 서버 데이터 캐시
  let moodChart;

  // 오늘 날짜 기본 설정 (로컬 타임존 기준)
  dateInput.value = new Date().toISOString().split('T')[0];

  // ------- 유틸: 키 불일치/대소문자 대응 -------
  const getField = (obj, ...candidates) => {
    // candidates 예: 'date', 'Date', 'DATE'
    for (const key of candidates) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    // 느슨한 매칭 (대소문자 무시)
    const lowerMap = Object.fromEntries(Object.keys(obj).map(k => [k.toLowerCase(), k]));
    for (const key of candidates) {
      const found = lowerMap[key.toLowerCase()];
      if (found && obj[found] !== undefined) return obj[found];
    }
    return undefined;
  };

  const parseDate = (value) => {
    // Google Sheets/Apps Script가 반환하는 Timestamp or Date 모두 처리
    // 빈 값 방지
    if (!value) return null;
    const d = new Date(value);
    if (!isNaN(d)) return d;
    // YYYY-MM-DD 같은 포맷 재시도
    try {
      const parts = String(value).split(/[^\d]/).filter(Boolean).map(Number);
      if (parts.length >= 3) return new Date(parts[0], parts[1] - 1, parts[2]);
    } catch {}
    return null;
  };

  const getDateForSort = (record) => {
    // 우선순위: Timestamp > date/Date
    const ts = getField(record, 'Timestamp', 'timestamp');
    const dt = getField(record, 'date', 'Date');
    return parseDate(ts || dt) || new Date(0);
  };

  // ------- 서버에서 기록 로드 -------
  const loadRecords = async () => {
    try {
      recordsContainer.innerHTML = '<p>데이터를 불러오는 중...</p>';
      const response = await fetch(WEB_APP_URL, { method: 'GET', redirect: 'follow' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const json = await response.json();
      if (!Array.isArray(json)) {
        console.error('Apps Script 응답이 배열이 아님:', json);
        throw new Error('Google Apps Script 설정을 확인하세요.');
      }

      recordsCache = json.slice();

      // 최신순 정렬 (Timestamp/Date 기준)
      recordsCache.sort((a, b) => getDateForSort(b) - getDateForSort(a));

      // 렌더
      recordsContainer.innerHTML = '';
      if (recordsCache.length === 0) {
        recordsContainer.innerHTML = '<p>아직 기록이 없습니다. 첫 기록을 남겨보세요!</p>';
      } else {
        recordsCache.forEach(addRecordToDOM);
      }

      renderMoodChart();

    } catch (err) {
      console.error('Error loading records:', err);
      recordsContainer.innerHTML = `<p style="color:red;">데이터를 불러오는 데 실패했습니다. GAS 웹 앱 URL과 접근 권한을 확인하세요.</p>`;
    }
  };

  // ------- DOM 렌더: 한 줄(행) 추가 -------
  const addRecordToDOM = (record) => {
    const row = document.createElement('div');
    row.classList.add('record-row');

    // 과목 맵(HTML select 값과 표시 텍스트를 일치)
    const subjectMap = {
      'math': '📘 3D그래픽스',
      'english': '📗 웹앱디자인',
      'science': '📕 책디자인',
      'etc': '📝 기타'
    };

    // 집중도(기분) 이모지
    const moodEmojis = {
      '높음': '😄',
      '보통': '😐',
      '낮음': '😔',
      '전혀 안 됨': '😡'
    };

    // 필드 읽기 (대소문자/영문-한글 혼재 대비)
    const type = getField(record, 'type', 'Type', '과목');
    const content = getField(record, 'content', 'Content', '공부내용', '공부 내용');
    const reaction = getField(record, 'reaction', 'Reaction', '난이도');
    const mood = getField(record, 'mood', 'Mood', '집중도');
    const dateStr = getField(record, 'date', 'Date', '날짜') || getField(record, 'Timestamp', 'timestamp');

    const dateObj = parseDate(dateStr);
    const dateDisplay = dateObj ? dateObj.toLocaleDateString('ko-KR') : (dateStr || '-');

    const subjectText = subjectMap[String(type)?.toLowerCase()] || String(type || '-');

    row.innerHTML = `
      <div class="record-type">${subjectText}</div>
      <div class="record-content" title="${content || ''}">${content || '-'}</div>
      <div class="record-reaction" title="${reaction || ''}">${reaction || '-'}</div>
      <div class="record-date">${dateDisplay}</div>
      <div class="record-mood">${moodEmojis[mood] || ''} ${mood || ''}</div>
    `;

    recordsContainer.appendChild(row);
  };

  // ------- 이번 달 집중도 차트 -------
  const renderMoodChart = () => {
    // 이번 달만 집계
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth();

    const thisMonthRecords = recordsCache.filter(r => {
      const d = getDateForSort(r);
      return d.getFullYear() === yyyy && d.getMonth() === mm;
    });

    const counts = thisMonthRecords.reduce((acc, r) => {
      const mood = getField(r, 'mood', 'Mood', '집중도') || '미입력';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (moodChart) moodChart.destroy();

    moodChart = new Chart(moodChartCanvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: '집중도',
          data,
          // 색상은 기본 팔레트 사용 (커스텀 필요 시 추가)
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: {
            display: true,
            text: '이번 달 집중도 분포'
          }
        }
      }
    });
  };

  // ------- 폼 제출(저장) -------
  recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '저장 중...';

    const formData = new FormData(recordForm);
    const payload = {
      type: formData.get('type'),      // 과목 (값: math/english/science/etc)
      date: formData.get('date'),      // 날짜 (YYYY-MM-DD)
      content: formData.get('content'),// 공부 내용
      mood: formData.get('mood'),      // 집중도
      reaction: formData.get('reaction') // 난이도(텍스트)
    };

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',        // Apps Script 설정에 따라 cors 또는 no-cors 사용
        cache: 'no-cache',
        redirect: 'follow',
        // no-cors에서는 대부분의 커스텀 헤더를 보낼 수 없으므로 body만 전송
        body: JSON.stringify(payload)
      });

      // no-cors는 응답을 읽을 수 없으므로 전송 성공 가정
      alert('성공적으로 기록되었습니다!');
      recordForm.reset();
      dateInput.value = new Date().toISOString().split('T')[0];
      loadRecords();

    } catch (err) {
      console.error('Error submitting record:', err);
      alert('기록 저장에 실패했습니다. 인터넷 연결과 GAS 설정을 확인하세요.');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = '공부 저장하기';
    }
  });

  // ------- 엑셀로 내보내기 -------
  exportButton.addEventListener('click', () => {
    if (!recordsCache.length) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    // 보기 좋게 컬럼 변환(한국어 헤더)
    const prettyRows = recordsCache.map(r => {
      const type = getField(r, 'type', 'Type', '과목');
      const content = getField(r, 'content', 'Content', '공부내용', '공부 내용');
      const reaction = getField(r, 'reaction', 'Reaction', '난이도');
      const mood = getField(r, 'mood', 'Mood', '집중도');
      const dateStr = getField(r, 'date', 'Date', '날짜') || getField(r, 'Timestamp', 'timestamp');
      const d = parseDate(dateStr);

      const subjectMap = {
        'math': '3D그래픽스',
        'english': '웹앱디자인',
        'science': '책디자인',
        'etc': '기타'
      };

      return {
        '과목': subjectMap[String(type)?.toLowerCase()] || String(type || ''),
        '공부 내용': content || '',
        '난이도': reaction || '',
        '날짜': d ? d.toLocaleDateString('ko-KR') : (dateStr || ''),
        '집중도': mood || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(prettyRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '공부 기록');

    // 파일 저장
    XLSX.writeFile(workbook, 'study_records.xlsx');
  });

  // 초기 로드
  loadRecords();
});
