export function Icon({ name, size = 20, filled = false }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.4-.8L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11h8m-8 3h5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    heart: <path d="M20.8 8.8c0 4.3-8.8 10-8.8 10s-8.8-5.7-8.8-10a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z" />,
    comment: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5 8 8 0 0 1-3.4-.8L4 20l1.5-4A7.5 7.5 0 1 1 20 11.5Z" /><path d="M8 11.5h8" /></>,
    share: <><path d="M12 15V3m-4 4 4-4 4 4" /><path d="M5 12v8h14v-8" /></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z" />,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
    play: <path d="m8 5 11 7-11 7z" />,
    volume: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M17 9a4 4 0 0 1 0 6" /><path d="M19.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
    volumeOff: <><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="m17 9 4 6" /><path d="m21 9-4 6" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.7 1.6L7 5l-1.3.4L5 7l-.7-1.6L3 5l1.3-.4L5 3Z" /></>,
  }

  return (
    <svg
      className={filled ? 'icon is-filled' : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled && name === 'heart' ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function Avatar({ src, initials, size = 'normal', className = '' }) {
  return (
    <span className={`avatar avatar-${size} ${className}`}>
      {src ? <img src={src} alt="" /> : <span>{initials}</span>}
    </span>
  )
}
