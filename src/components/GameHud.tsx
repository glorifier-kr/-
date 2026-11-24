import React from 'react';
import type { HudSnapshot } from '../game/ChristmasVillageEngine';
import type { TimePhase } from '../game/dayNightCycle';

interface GameHudProps {
  hud: HudSnapshot;
  onStart: () => void;
  onResume: () => void;
  onPause: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onToggleMute: () => void;
  onToggleLift: (quickBoard: boolean) => void;
  onSetTimePreset: (preset: 'day' | 'sunset' | 'night') => void;
  onInteractNpc: () => void;
  onAdvanceDialogue: () => void;
  onCloseDialogue: () => void;
}

// Custom inline SVG Golden Star Ornament icon matched 1:1 with in-world star pickups
function StarBadgeIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.2l2.9 6.1 6.7.9-4.9 4.7 1.2 6.7L12 17.4l-5.9 3.2 1.2-6.7-4.9-4.7 6.7-.9L12 2.2z"
        fill="#ffd966"
        stroke="#4a2b09"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 4.5l1.6 3.5 3.8.5-2.8 2.6.7 3.7L12 13l-3.3 1.8.7-3.7-2.8-2.6 3.8-.5L12 4.5z" fill="#fff5c0" />
    </svg>
  );
}

// Custom inline SVG 2-Person Chairlift icon
function ChairliftIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path d="M2 5.5L22 2.5" stroke="#f5d588" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 4v7.5" stroke="#f5d588" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="6" y="11.5" width="12" height="5.5" rx="1.4" fill="#c92b32" stroke="#2d1214" strokeWidth="1.2" />
      <path d="M7.5 17v3M16.5 17v3M6.5 20h11" stroke="#f5d588" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Crisp inline SVG Time-of-Day Icon (Day Sun / Sunset Horizon / Night Moon / Dawn Sunrise)
function TimePhaseIcon({ phase, className = 'w-5 h-5' }: { phase: TimePhase; className?: string }) {
  if (phase === 'day') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <circle cx="12" cy="12" r="4.8" fill="#ffd84d" stroke="#f59e0b" strokeWidth="1.4" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"
          stroke="#ffe066"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (phase === 'sunset') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M3 16.5h18" stroke="#f5a676" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M6.5 16.5a5.5 5.5 0 0111 0" fill="#ff7b47" stroke="#ffd27d" strokeWidth="1.3" />
        <path d="M12 5v2.4M6.2 8.2l1.6 1.6M17.8 8.2l-1.6 1.6" stroke="#ffbd6b" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (phase === 'dawn') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
        <path d="M3 17.5h18" stroke="#c8b6e2" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7 17.5a5 5 0 0110 0" fill="#f7b292" stroke="#ffe5c4" strokeWidth="1.3" />
        <path d="M12 6.5v2.5M9.5 9.5L12 7l2.5 2.5" stroke="#ffd8a8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M19.2 14.5A7.6 7.6 0 019.5 4.8a7.6 7.6 0 109.7 9.7z"
        fill="#ffe694"
        stroke="#d4a744"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="17.8" cy="6.2" r="1.2" fill="#fff5cc" />
      <circle cx="14.5" cy="4.2" r="0.85" fill="#cfe4ff" />
    </svg>
  );
}

// Bespoke inline SVG Title Crest Lockup over calm night-sky negative space
function TitleLockupSvg() {
  return (
    <svg
      viewBox="0 0 560 156"
      className="w-[min(520px,88vw)] h-auto drop-shadow-[0_6px_18px_rgba(4,9,18,0.88)]"
      role="img"
      aria-label="눈 내리는 크리스마스 마을"
    >
      {/* Decorative Golden Pine Wreath Crest & Star */}
      <path
        d="M170 28 H248 M312 28 H390"
        stroke="#e7bc62"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M280 9l4.2 9 9.8 1.3-7.1 6.8 1.7 9.7-8.6-4.6-8.6 4.6 1.7-9.7-7.1-6.8 9.8-1.3L280 9z"
        fill="#ffe07d"
        stroke="#4f2d08"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Main Title */}
      <text
        x="280"
        y="96"
        textAnchor="middle"
        className="font-storybook"
        fontSize="46"
        fontWeight="700"
        fill="#fff8e8"
        stroke="#0b1524"
        strokeWidth="6"
        paintOrder="stroke fill"
        letterSpacing="2"
      >
        크리스마스 마을
      </text>
      {/* Subtle Storybook Subtitle */}
      <text
        x="280"
        y="134"
        textAnchor="middle"
        fontSize="16"
        fontWeight="500"
        fill="#f0cf88"
        stroke="#091321"
        strokeWidth="3.5"
        paintOrder="stroke fill"
        letterSpacing="3.5"
      >
        하얀 토끼의 겨울 산책 · 2인 파노라마 리프트
      </text>
    </svg>
  );
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  onStart,
  onResume,
  onPause,
  onRestart,
  onReturnTitle,
  onToggleMute,
  onToggleLift,
  onSetTimePreset,
  onInteractNpc,
  onAdvanceDialogue,
  onCloseDialogue,
}) => {
  // =========================================================================
  // TITLE SCREEN (Live World Camera Tour behind calm night-sky negative space)
  // =========================================================================
  if (hud.phase === 'title') {
    return (
      <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-between pt-6 pb-8 px-6 z-20">
        {/* Top calm starry night-sky negative space title lockup */}
        <div className="flex flex-col items-center">
          <TitleLockupSvg />
        </div>

        {/* Lower Start CTA + single flat high-contrast control-hint line */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={(e) => {
              e.currentTarget.blur();
              onStart();
            }}
            className="pointer-events-auto cursor-pointer px-9 py-3.5 rounded-full bg-[#b9262d] hover:bg-[#cf3038] active:scale-[0.98] text-[#fff8eb] font-bold text-lg tracking-wide border-2 border-[#f2c86b] shadow-[0_8px_28px_rgba(0,0,0,0.72)] transition-transform duration-150"
          >
            마을 탐험 시작
          </button>

          <p
            className="text-sm font-medium text-[#fff5df] tracking-wide px-4 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(8, 17, 30, 0.72)' }}
          >
            WASD / 방향키 이동 · Space 점프 · E / L 2인 리프트 탑승 · P 일시정지
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* TOP-LEFT COMPACT STATUS CLUSTER (Star Counter + Zone + Time-of-Day Switcher) */}
      <div className="fixed top-4 left-4 flex flex-col items-start gap-2">
        <div
          className="flex items-center gap-3 px-4 py-2 rounded-xl border border-[#e8bf68]/45 shadow-[0_6px_18px_rgba(4,9,18,0.6)]"
          style={{ backgroundColor: 'rgba(11, 22, 38, 0.84)' }}
        >
          <StarBadgeIcon className="w-7 h-7 shrink-0" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#e6c478] font-bold">
              별빛 수집
            </span>
            <span
              className="text-2xl font-bold text-[#fff8e6] tabular-nums hud-text-shadow"
              aria-label={`별빛 ${hud.collectedCount} / ${hud.totalCollectibles}`}
            >
              {hud.collectedCount}
              <span className="text-sm text-[#b9c6d8] font-medium ml-0.5">
                /{hud.totalCollectibles}
              </span>
            </span>
          </div>
          <div className="w-px h-8 bg-[#e8bf68]/25 mx-0.5" />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.12em] text-[#9eb7d4]">현재 위치</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#f7efe0]">{hud.zone}</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  hud.movementMode === 'snowboard'
                    ? 'bg-[#b9262d]/85 text-[#fff6e0] border-[#f2c86b]/70'
                    : hud.movementMode === 'lift'
                      ? 'bg-[#1f5c3a]/85 text-[#e6ffef] border-[#8ce0aa]/60'
                      : 'bg-[#172b47] text-[#cfe0f5] border-[#6d8db5]/40'
                }`}
              >
                {hud.movementMode === 'snowboard'
                  ? '스노보드'
                  : hud.movementMode === 'lift'
                    ? '리프트 탑승'
                    : '도보'}
              </span>
            </div>
          </div>
        </div>

        {/* Time-of-Day Status Icon + Instant Manual Switch Buttons (낮 / 노을 / 밤) */}
        <div
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#e8bf68]/40 shadow-[0_6px_16px_rgba(4,9,18,0.55)]"
          style={{ backgroundColor: 'rgba(11, 22, 38, 0.86)' }}
          aria-label="시간대 조절"
        >
          <div className="flex items-center gap-1.5 pr-1.5 border-r border-[#e8bf68]/25">
            <TimePhaseIcon phase={hud.timePhase} className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold text-[#fff3d4] min-w-[26px]">{hud.timeLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'day', label: '낮' },
                { id: 'sunset', label: '노을' },
                { id: 'night', label: '밤' },
              ] as const
            ).map((opt) => {
              const active = hud.timePhase === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onSetTimePreset(opt.id);
                  }}
                  aria-label={`${opt.label}으로 전환`}
                  aria-pressed={active}
                  className={`cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border ${
                    active
                      ? 'bg-[#d99b38] text-[#111926] border-[#ffe394]'
                      : 'bg-[#152842] hover:bg-[#1f395c] text-[#dbe6f5] border-[#e8bf68]/25'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TOP-RIGHT COMPACT UTILITY CONTROLS (Chairlift Quick-Ride, Mute, Pause) */}
      <div className="fixed top-4 right-4 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleLift(true);
          }}
          className={`cursor-pointer flex items-center gap-2 px-3.5 h-10 rounded-xl border text-sm font-semibold shadow-[0_4px_14px_rgba(4,9,18,0.55)] transition-colors ${
            hud.isRidingLift
              ? 'bg-[#b9262d] hover:bg-[#cf3038] text-[#fff8e8] border-[#f2c86b]'
              : 'bg-[#12243d]/90 hover:bg-[#1a3354] text-[#f8ecd2] border-[#e8bf68]/45'
          }`}
          aria-label={hud.isRidingLift ? '2인 리프트 내리기' : '2인 리프트 탑승'}
        >
          <ChairliftIcon className="w-5 h-5" />
          <span>{hud.isRidingLift ? '리프트 내리기 [E]' : '2인 리프트 [L]'}</span>
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          className="cursor-pointer w-10 h-10 rounded-xl flex items-center justify-center border border-[#e8bf68]/40 text-[#f5e7c6] hover:bg-[#1a3354] shadow-[0_4px_14px_rgba(4,9,18,0.55)]"
          style={{ backgroundColor: 'rgba(11, 22, 38, 0.86)' }}
          aria-label={hud.muted ? '소리 켜기' : '음소거'}
          title="음소거 [M]"
        >
          {hud.muted ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.5 8.5a5 5 0 010 7M18.8 5.8a9 9 0 010 12.4" strokeLinecap="round" />
            </svg>
          )}
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            onPause();
          }}
          className="cursor-pointer w-10 h-10 rounded-xl flex items-center justify-center border border-[#e8bf68]/40 text-[#f5e7c6] hover:bg-[#1a3354] shadow-[0_4px_14px_rgba(4,9,18,0.55)]"
          style={{ backgroundColor: 'rgba(11, 22, 38, 0.86)' }}
          aria-label="일시정지"
          title="일시정지 [P]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </button>
      </div>

      {/* TOAST BANNER (Discovery / Lift status) */}
      {hud.lastToast && hud.phase === 'playing' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2">
          <div
            className="px-5 py-2 rounded-full border border-[#f2c86b]/60 text-sm font-semibold text-[#fff4d4] shadow-[0_6px_20px_rgba(4,9,18,0.65)]"
            style={{ backgroundColor: 'rgba(14, 28, 48, 0.9)' }}
          >
            {hud.lastToast}
          </div>
        </div>
      )}

      {/* NPC CHRISTMAS DIALOGUE BOX (Red Postbox / Toy Shop — Celebrating Jesus's Birth) */}
      {hud.phase === 'playing' && hud.activeDialogue && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(580px,92vw)] pointer-events-auto"
          role="region"
          aria-label="NPC 대화"
        >
          <div
            className="rounded-2xl border-2 border-[#f2c86b] px-6 py-4 shadow-[0_14px_38px_rgba(4,9,18,0.82)]"
            style={{ backgroundColor: 'rgba(13, 25, 44, 0.95)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StarBadgeIcon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold text-[#ffd966] tracking-wide">
                  {hud.activeDialogue.speaker}
                </span>
              </div>
              <span className="text-xs text-[#a9bdd8] tabular-nums">
                {hud.activeDialogue.lineIndex + 1} / {hud.activeDialogue.totalLines}
              </span>
            </div>
            <p className="text-[15px] leading-relaxed text-[#fff8eb] font-medium mb-3.5">
              {hud.activeDialogue.text}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onCloseDialogue();
                }}
                className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold text-[#cbd7e8] hover:bg-[#1a3150] border border-[#e8bf68]/25"
              >
                닫기 [Esc]
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onAdvanceDialogue();
                }}
                className="cursor-pointer px-4 py-1.5 rounded-lg bg-[#b9262d] hover:bg-[#cf3038] text-[#fff8eb] text-xs font-bold border border-[#f2c86b]"
              >
                {hud.activeDialogue.lineIndex + 1 < hud.activeDialogue.totalLines
                  ? '다음 이야기 [E]'
                  : '인사 마치기 [E]'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXTUAL NPC SPEECH BUBBLE PROMPT (When approaching Red Postbox or Toy Shop Door) */}
      {hud.phase === 'playing' && !hud.activeDialogue && hud.nearNpcPrompt && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              onInteractNpc();
            }}
            className="cursor-pointer flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#fff7e6] hover:bg-[#ffffff] text-[#24160c] font-bold text-sm border-2 border-[#d99b38] shadow-[0_8px_24px_rgba(4,9,18,0.72)]"
          >
            <span className="px-2 py-0.5 rounded-md bg-[#b9262d] text-[#fff8eb] text-xs font-extrabold">
              E
            </span>
            <span>{hud.nearNpcPrompt}</span>
          </button>
        </div>
      )}

      {/* BOTTOM-CENTER CONTEXTUAL CHAIRLIFT PROMPT / PANORAMA BAR */}
      {hud.phase === 'playing' && !hud.activeDialogue && !hud.nearNpcPrompt && (hud.isRidingLift || hud.nearLift) && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto">
          {hud.isRidingLift ? (
            <div
              className="flex items-center gap-4 px-5 py-2.5 rounded-2xl border border-[#f2c86b]/60 shadow-[0_8px_24px_rgba(4,9,18,0.7)]"
              style={{ backgroundColor: 'rgba(11, 22, 38, 0.88)' }}
            >
              <div className="flex items-center gap-2 text-[#ffe394] font-semibold text-sm">
                <ChairliftIcon className="w-5 h-5" />
                <span>마을 전경 파노라마 · 자동 상승 중</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[#1b3556] text-[#d6e6fa] tabular-nums">
                  고도 {hud.liftAltitude}m
                </span>
              </div>
              <span className="text-xs text-[#cbd7e8] hidden sm:inline">
                마우스 드래그 시점 회전 · 휠 줌
              </span>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  onToggleLift(false);
                }}
                className="cursor-pointer px-3.5 py-1 rounded-lg bg-[#b9262d] hover:bg-[#cf3038] text-[#fff8e8] text-xs font-bold border border-[#f2c86b]/70"
              >
                [E] 내리기
              </button>
            </div>
          ) : (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleLift(false);
              }}
              className="cursor-pointer flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#b9262d] hover:bg-[#cf3038] text-[#fff8eb] font-bold text-sm border-2 border-[#f2c86b] shadow-[0_8px_24px_rgba(4,9,18,0.72)]"
            >
              <ChairliftIcon className="w-5 h-5" />
              <span>[E] 도착선 리프트 탑승하여 출발선까지 올라가기</span>
            </button>
          )}
        </div>
      )}

      {/* SUBTLE FLAT CONTROL HINT WHEN WALKING / SNOWBOARDING (Readable in both Day & Night) */}
      {hud.phase === 'playing' && !hud.activeDialogue && !hud.nearNpcPrompt && !hud.isRidingLift && !hud.nearLift && (
        <div className="fixed bottom-3.5 left-1/2 -translate-x-1/2">
          <p
            className="text-xs text-[#f7eedb] tracking-wide px-4 py-1.5 rounded-full border border-[#e8bf68]/30 whitespace-nowrap shadow-[0_4px_12px_rgba(4,9,18,0.45)]"
            style={{ backgroundColor: 'rgba(11, 22, 38, 0.78)' }}
          >
            WASD / 방향키 이동 (눈 위 자동 스노보드) · Space×2 공중 360° 회전 · E 대화 / 도착선 리프트
          </p>
        </div>
      )}

      {/* PAUSE MODAL */}
      {hud.phase === 'paused' && (
        <div
          className="fixed inset-0 pointer-events-auto flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.72)' }}
          role="dialog"
          aria-modal="true"
          aria-label="일시정지"
        >
          <div
            className="w-full max-w-sm rounded-2xl border-2 border-[#e8bf68]/60 p-7 text-center shadow-[0_18px_48px_rgba(0,0,0,0.75)]"
            style={{ backgroundColor: 'rgba(13, 25, 44, 0.96)' }}
          >
            <h2 className="font-storybook text-2xl font-bold text-[#fff5dd] mb-2">일시정지</h2>
            <p className="text-sm text-[#c4d2e4] mb-5">
              수집한 크리스마스 별빛:{' '}
              <strong className="text-[#ffd966] tabular-nums">
                {hud.collectedCount} / {hud.totalCollectibles}
              </strong>
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-[#b9262d] hover:bg-[#cf3038] text-[#fff8ea] font-bold border border-[#f2c86b]"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-[#1a3150] hover:bg-[#234066] text-[#f5ebd6] font-semibold border border-[#e8bf68]/35"
              >
                처음부터 다시 산책
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-transparent hover:bg-[#162a45] text-[#c7d3e3] font-medium border border-[#e8bf68]/20"
              >
                타이틀 화면으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / COMPLETION MODAL */}
      {hud.phase === 'gameover' && (
        <div
          className="fixed inset-0 pointer-events-auto flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.72)' }}
          role="dialog"
          aria-modal="true"
          aria-label="크리스마스 마을 탐험 완료"
        >
          <div
            className="w-full max-w-md rounded-2xl border-2 border-[#f2c86b] p-7 text-center shadow-[0_18px_48px_rgba(0,0,0,0.78)]"
            style={{ backgroundColor: 'rgba(13, 25, 44, 0.96)' }}
          >
            <div className="flex justify-center mb-2">
              <StarBadgeIcon className="w-12 h-12" />
            </div>
            <h2 className="font-storybook text-2xl font-bold text-[#fff5dd] mb-2">
              크리스마스 별빛을 모두 모았어요!
            </h2>
            <p className="text-sm text-[#c4d2e4] mb-5">
              눈 내리는 마을과 2인 파노라마 리프트의 모든 추억을 완성했습니다.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-xl bg-[#0b1729] border border-[#e8bf68]/30 py-3">
                <div className="text-xs text-[#9cb2cf]">별빛 수집</div>
                <div className="text-2xl font-bold text-[#ffd966] tabular-nums">
                  {hud.collectedCount}/{hud.totalCollectibles}
                </div>
              </div>
              <div className="rounded-xl bg-[#0b1729] border border-[#e8bf68]/30 py-3">
                <div className="text-xs text-[#9cb2cf]">상태</div>
                <div className="text-lg font-bold text-[#9de3b0]">마을 마스터</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-[#1e5c3a] hover:bg-[#267048] text-[#fff8ea] font-bold border border-[#9de3b0]/50"
              >
                마을 계속 자유롭게 둘러보기
              </button>
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="cursor-pointer w-full py-2.5 rounded-xl bg-[#b9262d] hover:bg-[#cf3038] text-[#fff8ea] font-bold border border-[#f2c86b]"
              >
                처음부터 다시 탐험하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
