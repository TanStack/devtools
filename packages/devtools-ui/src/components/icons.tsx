// import { Show, createUniqueId } from 'solid-js'

/* export function Search() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 13L9.00007 9M10.3333 5.66667C10.3333 8.244 8.244 10.3333 5.66667 10.3333C3.08934 10.3333 1 8.244 1 5.66667C1 3.08934 3.08934 1 5.66667 1C8.244 1 10.3333 3.08934 10.3333 5.66667Z"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function Trash() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
} */
/* 
export function ChevronDown() {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ArrowUp() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 13.3333V2.66667M8 2.66667L4 6.66667M8 2.66667L12 6.66667"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ArrowDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2.66667V13.3333M8 13.3333L4 9.33333M8 13.3333L12 9.33333"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ArrowLeft() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: 'rotate(90deg)',
      }}
    >
      <path
        d="M8 2.66667V13.3333M8 13.3333L4 9.33333M8 13.3333L12 9.33333"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ArrowRight() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: 'rotate(-90deg)',
      }}
    >
      <path
        d="M8 2.66667V13.3333M8 13.3333L4 9.33333M8 13.3333L12 9.33333"
        stroke="currentColor"
        stroke-width="1.66667"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function Sun() {
  return (
    <svg
      viewBox="0 0 24 24"
      height="12"
      width="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2v2m0 16v2M4 12H2m4.314-5.686L4.9 4.9m12.786 1.414L19.1 4.9M6.314 17.69 4.9 19.104m12.786-1.414 1.414 1.414M22 12h-2m-3 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  )
}

export function Moon() {
  return (
    <svg
      viewBox="0 0 24 24"
      height="12"
      width="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 15.844a10.424 10.424 0 0 1-4.306.925c-5.779 0-10.463-4.684-10.463-10.462 0-1.536.33-2.994.925-4.307A10.464 10.464 0 0 0 2 11.538C2 17.316 6.684 22 12.462 22c4.243 0 7.896-2.526 9.538-6.156Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  )
}

export function Monitor() {
  return (
    <svg
      viewBox="0 0 24 24"
      height="12"
      width="12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 21h8m-4-4v4m-5.2-4h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C22 14.72 22 13.88 22 12.2V7.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C19.72 3 18.88 3 17.2 3H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C2 5.28 2 6.12 2 7.8v4.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C4.28 17 5.12 17 6.8 17Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  )
}

export function Wifi() {
  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      stroke-width="0"
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"></path>
    </svg>
  )
}

export function Offline() {
  return (
    <svg
      stroke-width="0"
      viewBox="0 0 24 24"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="none"
        d="M24 .01c0-.01 0-.01 0 0L0 0v24h24V.01zM0 0h24v24H0V0zm0 0h24v24H0V0z"
      ></path>
      <path d="M22.99 9C19.15 5.16 13.8 3.76 8.84 4.78l2.52 2.52c3.47-.17 6.99 1.05 9.63 3.7l2-2zm-4 4a9.793 9.793 0 00-4.49-2.56l3.53 3.53.96-.97zM2 3.05L5.07 6.1C3.6 6.82 2.22 7.78 1 9l1.99 2c1.24-1.24 2.67-2.16 4.2-2.77l2.24 2.24A9.684 9.684 0 005 13v.01L6.99 15a7.042 7.042 0 014.92-2.06L18.98 20l1.27-1.26L3.29 1.79 2 3.05zM9 17l3 3 3-3a4.237 4.237 0 00-6 0z"></path>
    </svg>
  )
} */

/* export function Settings() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.3951 19.3711L9.97955 20.6856C10.1533 21.0768 10.4368 21.4093 10.7958 21.6426C11.1547 21.8759 11.5737 22.0001 12.0018 22C12.4299 22.0001 12.8488 21.8759 13.2078 21.6426C13.5667 21.4093 13.8503 21.0768 14.024 20.6856L14.6084 19.3711C14.8165 18.9047 15.1664 18.5159 15.6084 18.26C16.0532 18.0034 16.5678 17.8941 17.0784 17.9478L18.5084 18.1C18.9341 18.145 19.3637 18.0656 19.7451 17.8713C20.1265 17.6771 20.4434 17.3763 20.6573 17.0056C20.8715 16.635 20.9735 16.2103 20.9511 15.7829C20.9286 15.3555 20.7825 14.9438 20.5307 14.5978L19.684 13.4344C19.3825 13.0171 19.2214 12.5148 19.224 12C19.2239 11.4866 19.3865 10.9864 19.6884 10.5711L20.5351 9.40778C20.787 9.06175 20.933 8.65007 20.9555 8.22267C20.978 7.79528 20.8759 7.37054 20.6618 7C20.4479 6.62923 20.131 6.32849 19.7496 6.13423C19.3681 5.93997 18.9386 5.86053 18.5129 5.90556L17.0829 6.05778C16.5722 6.11141 16.0577 6.00212 15.6129 5.74556C15.17 5.48825 14.82 5.09736 14.6129 4.62889L14.024 3.31444C13.8503 2.92317 13.5667 2.59072 13.2078 2.3574C12.8488 2.12408 12.4299 1.99993 12.0018 2C11.5737 1.99993 11.1547 2.12408 10.7958 2.3574C10.4368 2.59072 10.1533 2.92317 9.97955 3.31444L9.3951 4.62889C9.18803 5.09736 8.83798 5.48825 8.3951 5.74556C7.95032 6.00212 7.43577 6.11141 6.9251 6.05778L5.49066 5.90556C5.06499 5.86053 4.6354 5.93997 4.25397 6.13423C3.87255 6.32849 3.55567 6.62923 3.34177 7C3.12759 7.37054 3.02555 7.79528 3.04804 8.22267C3.07052 8.65007 3.21656 9.06175 3.46844 9.40778L4.3151 10.5711C4.61704 10.9864 4.77964 11.4866 4.77955 12C4.77964 12.5134 4.61704 13.0137 4.3151 13.4289L3.46844 14.5922C3.21656 14.9382 3.07052 15.3499 3.04804 15.7773C3.02555 16.2047 3.12759 16.6295 3.34177 17C3.55589 17.3706 3.8728 17.6712 4.25417 17.8654C4.63554 18.0596 5.06502 18.1392 5.49066 18.0944L6.92066 17.9422C7.43133 17.8886 7.94587 17.9979 8.39066 18.2544C8.83519 18.511 9.18687 18.902 9.3951 19.3711Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M12 15C13.6568 15 15 13.6569 15 12C15 10.3431 13.6568 9 12 9C10.3431 9 8.99998 10.3431 8.99998 12C8.99998 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
} */

export function Copier() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        class="copier"
        d="M8 8V5.2C8 4.0799 8 3.51984 8.21799 3.09202C8.40973 2.71569 8.71569 2.40973 9.09202 2.21799C9.51984 2 10.0799 2 11.2 2H18.8C19.9201 2 20.4802 2 20.908 2.21799C21.2843 2.40973 21.5903 2.71569 21.782 3.09202C22 3.51984 22 4.0799 22 5.2V12.8C22 13.9201 22 14.4802 21.782 14.908C21.5903 15.2843 21.2843 15.5903 20.908 15.782C20.4802 16 19.9201 16 18.8 16H16M5.2 22H12.8C13.9201 22 14.4802 22 14.908 21.782C15.2843 21.5903 15.5903 21.2843 15.782 20.908C16 20.4802 16 19.9201 16 18.8V11.2C16 10.0799 16 9.51984 15.782 9.09202C15.5903 8.71569 15.2843 8.40973 14.908 8.21799C14.4802 8 13.9201 8 12.8 8H5.2C4.0799 8 3.51984 8 3.09202 8.21799C2.71569 8.40973 2.40973 8.71569 2.21799 9.09202C2 9.51984 2 10.0799 2 11.2V18.8C2 19.9201 2 20.4802 2.21799 20.908C2.40973 21.2843 2.71569 21.5903 3.09202 21.782C3.51984 22 4.07989 22 5.2 22Z"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke="currentColor"
      />
    </svg>
  )
}

export function List() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M8 6h10" />
      <path d="M6 12h9" />
      <path d="M11 18h7" />
    </svg>
  )
}

export function PageSearch() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide lucide-file-search2-icon lucide-file-search-2"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <circle cx="11.5" cy="14.5" r="2.5" />
      <path d="M13.3 16.3 15 18" />
    </svg>
  )
}

export function Cogs() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 2v2" />
      <path d="M12 22v-2" />
      <path d="m17 20.66-1-1.73" />
      <path d="M11 10.27 7 3.34" />
      <path d="m20.66 17-1.73-1" />
      <path d="m3.34 7 1.73 1" />
      <path d="M14 12h8" />
      <path d="M2 12h2" />
      <path d="m20.66 7-1.73 1" />
      <path d="m3.34 17 1.73-1" />
      <path d="m17 3.34-1 1.73" />
      <path d="m11 13.73-4 6.93" />
    </svg>
  )
}

export function SettingsCog() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m10 9-3 3 3 3" />
      <path d="m14 15 3-3-3-3" />
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    </svg>
  )
}

export function Keyboard() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M10 8h.01" />
      <path d="M12 12h.01" />
      <path d="M14 8h.01" />
      <path d="M16 12h.01" />
      <path d="M18 8h.01" />
      <path d="M6 8h.01" />
      <path d="M7 16h10" />
      <path d="M8 12h.01" />
      <rect width="20" height="16" x="2" y="4" rx="2" />
    </svg>
  )
}

export function GeoTag() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function SocialBubble() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m10 9-3 3 3 3" />
      <path d="m14 15 3-3-3-3" />
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    </svg>
  )
}

export function Link() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  )
}
/* 

export function Pencil() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 21.4998L8.04927 19.3655C8.40421 19.229 8.58168 19.1607 8.74772 19.0716C8.8952 18.9924 9.0358 18.901 9.16804 18.7984C9.31692 18.6829 9.45137 18.5484 9.72028 18.2795L21 6.99982C22.1046 5.89525 22.1046 4.10438 21 2.99981C19.8955 1.89525 18.1046 1.89524 17 2.99981L5.72028 14.2795C5.45138 14.5484 5.31692 14.6829 5.20139 14.8318C5.09877 14.964 5.0074 15.1046 4.92823 15.2521C4.83911 15.4181 4.77085 15.5956 4.63433 15.9506L2.5 21.4998ZM2.5 21.4998L4.55812 16.1488C4.7054 15.7659 4.77903 15.5744 4.90534 15.4867C5.01572 15.4101 5.1523 15.3811 5.2843 15.4063C5.43533 15.4351 5.58038 15.5802 5.87048 15.8703L8.12957 18.1294C8.41967 18.4195 8.56472 18.5645 8.59356 18.7155C8.61877 18.8475 8.58979 18.9841 8.51314 19.0945C8.42545 19.2208 8.23399 19.2944 7.85107 19.4417L2.5 21.4998Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
} */

export function X() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function PackageIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.5 9.39999L7.5 4.20999M12 17.5L12 3M21 16V7.99999C20.9996 7.64926 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.26999L13 2.26999C12.696 2.09446 12.3511 2.00204 12 2.00204C11.6489 2.00204 11.304 2.09446 11 2.26999L4 6.26999C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64926 3 7.99999V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function CheckCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.76489 14.1003 1.98232 16.07 2.85999M22 4L12 14.01L9 11.01"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function XCircleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ChevronDownIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 13V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H11M15 3H21M21 3V9M21 3L10 14"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function PiP() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M2 10h6V4" />
      <path d="m2 4 6 6" />
      <path d="M21 10V7a2 2 0 0 0-2-2h-7" />
      <path d="M3 14v2a2 2 0 0 0 2 2h3" />
      <rect x="12" y="14" width="10" height="7" rx="1" />
    </svg>
  )
}

export function CopiedCopier(props: { theme: 'light' | 'dark' }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 12L10.5 15L16.5 9M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
        stroke={props.theme === 'dark' ? '#12B76A' : '#027A48'}
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function ErrorCopier() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 9L15 15M15 9L9 15M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
        stroke="#F04438"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}
/* 
export function List() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect class="list" width="20" height="20" y="2" x="2" rx="2" />
      <line class="list-item" y1="7" y2="7" x1="6" x2="18" />
      <line class="list-item" y2="12" y1="12" x1="6" x2="18" />
      <line class="list-item" y1="17" y2="17" x1="6" x2="18" />
    </svg>
  )
}

export function Check(props: { checked: boolean; theme: 'light' | 'dark' }) {
  return (
    <>
      <Show when={props.checked}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.5 12L10.5 15L16.5 9M7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21Z"
            stroke={props.theme === 'dark' ? '#9B8AFB' : '#6938EF'}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </Show>
      <Show when={!props.checked}>
        <svg
          viewBox="0 0 24 24"
          height="20"
          width="20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 7.8c0-1.68 0-2.52.327-3.162a3 3 0 0 1 1.311-1.311C5.28 3 6.12 3 7.8 3h8.4c1.68 0 2.52 0 3.162.327a3 3 0 0 1 1.311 1.311C21 5.28 21 6.12 21 7.8v8.4c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C18.72 21 17.88 21 16.2 21H7.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C3 18.72 3 17.88 3 16.2V7.8Z"
            stroke={props.theme === 'dark' ? '#9B8AFB' : '#6938EF'}
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          ></path>
        </svg>
      </Show>
    </>
  )
}

export function CheckCircle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 12L10.5 15L16.5 9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function LoadingCircle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2V6M12 18V22M6 12H2M22 12H18M19.0784 19.0784L16.25 16.25M19.0784 4.99994L16.25 7.82837M4.92157 19.0784L7.75 16.25M4.92157 4.99994L7.75 7.82837"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <animateTransform
        attributeName="transform"
        attributeType="XML"
        type="rotate"
        from="0"
        to="360"
        dur="2s"
        repeatCount="indefinite"
      />
    </svg>
  )
}

export function XCircle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 9L9 15M9 9L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
}

export function PauseCircle() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.5 15V9M14.5 15V9M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  )
} */
/* 
export function TanstackLogo() {
  const id = createUniqueId()
  return (
    <svg version="1.0" viewBox="0 0 633 633">
      <linearGradient
        id={`a-${id}`}
        x1="-666.45"
        x2="-666.45"
        y1="163.28"
        y2="163.99"
        gradientTransform="matrix(633 0 0 633 422177 -103358)"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#6BDAFF" offset="0" />
        <stop stop-color="#F9FFB5" offset=".32" />
        <stop stop-color="#FFA770" offset=".71" />
        <stop stop-color="#FF7373" offset="1" />
      </linearGradient>
      <circle cx="316.5" cy="316.5" r="316.5" fill={`url(#a-${id})`} />

      <defs>
        <filter
          id={`am-${id}`}
          x="-137.5"
          y="412"
          width="454"
          height="396.9"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`b-${id}`}
        x="-137.5"
        y="412"
        width="454"
        height="396.9"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#am-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#b-${id})`}>
        <ellipse
          cx="89.5"
          cy="610.5"
          rx="214.5"
          ry="186"
          fill="#015064"
          stroke="#00CFE2"
          stroke-width="25"
        />
      </g>
      <defs>
        <filter
          id={`ah-${id}`}
          x="316.5"
          y="412"
          width="454"
          height="396.9"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`k-${id}`}
        x="316.5"
        y="412"
        width="454"
        height="396.9"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#ah-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#k-${id})`}>
        <ellipse
          cx="543.5"
          cy="610.5"
          rx="214.5"
          ry="186"
          fill="#015064"
          stroke="#00CFE2"
          stroke-width="25"
        />
      </g>
      <defs>
        <filter
          id={`ae-${id}`}
          x="-137.5"
          y="450"
          width="454"
          height="396.9"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`j-${id}`}
        x="-137.5"
        y="450"
        width="454"
        height="396.9"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#ae-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#j-${id})`}>
        <ellipse
          cx="89.5"
          cy="648.5"
          rx="214.5"
          ry="186"
          fill="#015064"
          stroke="#00A8B8"
          stroke-width="25"
        />
      </g>
      <defs>
        <filter
          id={`ai-${id}`}
          x="316.5"
          y="450"
          width="454"
          height="396.9"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`i-${id}`}
        x="316.5"
        y="450"
        width="454"
        height="396.9"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#ai-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#i-${id})`}>
        <ellipse
          cx="543.5"
          cy="648.5"
          rx="214.5"
          ry="186"
          fill="#015064"
          stroke="#00A8B8"
          stroke-width="25"
        />
      </g>
      <defs>
        <filter
          id={`aj-${id}`}
          x="-137.5"
          y="486"
          width="454"
          height="396.9"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`h-${id}`}
        x="-137.5"
        y="486"
        width="454"
        height="396.9"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#aj-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#h-${id})`}>
        <ellipse
          cx="89.5"
          cy="684.5"
          rx="214.5"
          ry="186"
          fill="#015064"
          stroke="#007782"
          stroke-width="25"
        />
      </g>
      <defs>
        <filter
          id={`ag-${id}`}
          x="316.5"
          y="486"
          width="454"
          height="396.9"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`g-${id}`}
        x="316.5"
        y="486"
        width="454"
        height="396.9"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#ag-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#g-${id})`}>
        <ellipse
          cx="543.5"
          cy="684.5"
          rx="214.5"
          ry="186"
          fill="#015064"
          stroke="#007782"
          stroke-width="25"
        />
      </g>
      <defs>
        <filter
          id={`af-${id}`}
          x="272.2"
          y="308"
          width="176.9"
          height="129.3"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`f-${id}`}
        x="272.2"
        y="308"
        width="176.9"
        height="129.3"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#af-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#f-${id})`}>
        <line
          x1="436"
          x2="431"
          y1="403.2"
          y2="431.8"
          fill="none"
          stroke="#000"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="11"
        />

        <line
          x1="291"
          x2="280"
          y1="341.5"
          y2="403.5"
          fill="none"
          stroke="#000"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="11"
        />

        <line
          x1="332.9"
          x2="328.6"
          y1="384.1"
          y2="411.2"
          fill="none"
          stroke="#000"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="11"
        />

        <linearGradient
          id={`m-${id}`}
          x1="-670.75"
          x2="-671.59"
          y1="164.4"
          y2="164.49"
          gradientTransform="matrix(-184.16 -32.472 -11.461 64.997 -121359 -32126)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#EE2700" offset="0" />
          <stop stop-color="#FF008E" offset="1" />
        </linearGradient>

        <path
          d="m344.1 363 97.7 17.2c5.8 2.1 8.2 6.1 7.1 12.1s-4.7 9.2-11 9.9l-106-18.7-57.5-59.2c-3.2-4.8-2.9-9.1 0.8-12.8s8.3-4.4 13.7-2.1l55.2 53.6z"
          clip-rule="evenodd"
          fill={`url(#m-${id})`}
          fill-rule="evenodd"
        />

        <line
          x1="428.2"
          x2="429.1"
          y1="384.5"
          y2="378"
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="7"
        />

        <line
          x1="395.2"
          x2="396.1"
          y1="379.5"
          y2="373"
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="7"
        />

        <line
          x1="362.2"
          x2="363.1"
          y1="373.5"
          y2="367.4"
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="7"
        />

        <line
          x1="324.2"
          x2="328.4"
          y1="351.3"
          y2="347.4"
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="7"
        />

        <line
          x1="303.2"
          x2="307.4"
          y1="331.3"
          y2="327.4"
          fill="none"
          stroke="#fff"
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="7"
        />
      </g>
      <defs>
        <filter
          id={`ak-${id}`}
          x="73.2"
          y="113.8"
          width="280.6"
          height="317.4"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`e-${id}`}
        x="73.2"
        y="113.8"
        width="280.6"
        height="317.4"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#ak-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#e-${id})`}>
        <linearGradient
          id={`n-${id}`}
          x1="-672.16"
          x2="-672.16"
          y1="165.03"
          y2="166.03"
          gradientTransform="matrix(-100.18 48.861 97.976 200.88 -83342 -93.059)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#A17500" offset="0" />
          <stop stop-color="#5D2100" offset="1" />
        </linearGradient>

        <path
          d="m192.3 203c8.1 37.3 14 73.6 17.8 109.1 3.8 35.4 2.8 75.1-3 119.2l61.2-16.7c-15.6-59-25.2-97.9-28.6-116.6s-10.8-51.9-22.1-99.6l-25.3 4.6"
          clip-rule="evenodd"
          fill={`url(#n-${id})`}
          fill-rule="evenodd"
        />
        <g stroke="#2F8A00">
          <linearGradient
            id={`r-${id}`}
            x1="-660.23"
            x2="-660.23"
            y1="166.72"
            y2="167.72"
            gradientTransform="matrix(92.683 4.8573 -2.0259 38.657 61680 -3088.6)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#2F8A00" offset="0" />
            <stop stop-color="#90FF57" offset="1" />
          </linearGradient>

          <path
            d="m195 183.9s-12.6-22.1-36.5-29.9c-15.9-5.2-34.4-1.5-55.5 11.1 15.9 14.3 29.5 22.6 40.7 24.9 16.8 3.6 51.3-6.1 51.3-6.1z"
            clip-rule="evenodd"
            fill={`url(#r-${id})`}
            fill-rule="evenodd"
            stroke-width="13"
          />

          <linearGradient
            id={`s-${id}`}
            x1="-661.36"
            x2="-661.36"
            y1="164.18"
            y2="165.18"
            gradientTransform="matrix(110 5.7648 -6.3599 121.35 73933 -15933)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#2F8A00" offset="0" />
            <stop stop-color="#90FF57" offset="1" />
          </linearGradient>

          <path
            d="m194.9 184.5s-47.5-8.5-83.2 15.7c-23.8 16.2-34.3 49.3-31.6 99.4 30.3-27.8 52.1-48.5 65.2-61.9 19.8-20.2 49.6-53.2 49.6-53.2z"
            clip-rule="evenodd"
            fill={`url(#s-${id})`}
            fill-rule="evenodd"
            stroke-width="13"
          />

          <linearGradient
            id={`q-${id}`}
            x1="-656.79"
            x2="-656.79"
            y1="165.15"
            y2="166.15"
            gradientTransform="matrix(62.954 3.2993 -3.5023 66.828 42156 -8754.1)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#2F8A00" offset="0" />
            <stop stop-color="#90FF57" offset="1" />
          </linearGradient>

          <path
            d="m195 183.9c-0.8-21.9 6-38 20.6-48.2s29.8-15.4 45.5-15.3c-6.1 21.4-14.5 35.8-25.2 43.4s-24.4 14.2-40.9 20.1z"
            clip-rule="evenodd"
            fill={`url(#q-${id})`}
            fill-rule="evenodd"
            stroke-width="13"
          />

          <linearGradient
            id={`p-${id}`}
            x1="-663.07"
            x2="-663.07"
            y1="165.44"
            y2="166.44"
            gradientTransform="matrix(152.47 7.9907 -3.0936 59.029 101884 -4318.7)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#2F8A00" offset="0" />
            <stop stop-color="#90FF57" offset="1" />
          </linearGradient>

          <path
            d="m194.9 184.5c31.9-30 64.1-39.7 96.7-29s50.8 30.4 54.6 59.1c-35.2-5.5-60.4-9.6-75.8-12.1-15.3-2.6-40.5-8.6-75.5-18z"
            clip-rule="evenodd"
            fill={`url(#p-${id})`}
            fill-rule="evenodd"
            stroke-width="13"
          />

          <linearGradient
            id={`o-${id}`}
            x1="-662.57"
            x2="-662.57"
            y1="164.44"
            y2="165.44"
            gradientTransform="matrix(136.46 7.1517 -5.2163 99.533 91536 -11442)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#2F8A00" offset="0" />
            <stop stop-color="#90FF57" offset="1" />
          </linearGradient>

          <path
            d="m194.9 184.5c35.8-7.6 65.6-0.2 89.2 22s37.7 49 42.3 80.3c-39.8-9.7-68.3-23.8-85.5-42.4s-32.5-38.5-46-59.9z"
            clip-rule="evenodd"
            fill={`url(#o-${id})`}
            fill-rule="evenodd"
            stroke-width="13"
          />

          <linearGradient
            id={`l-${id}`}
            x1="-656.43"
            x2="-656.43"
            y1="163.86"
            y2="164.86"
            gradientTransform="matrix(60.866 3.1899 -8.7773 167.48 41560 -25168)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#2F8A00" offset="0" />
            <stop stop-color="#90FF57" offset="1" />
          </linearGradient>

          <path
            d="m194.9 184.5c-33.6 13.8-53.6 35.7-60.1 65.6s-3.6 63.1 8.7 99.6c27.4-40.3 43.2-69.6 47.4-88s5.6-44.1 4-77.2z"
            clip-rule="evenodd"
            fill={`url(#l-${id})`}
            fill-rule="evenodd"
            stroke-width="13"
          />
          <path
            d="m196.5 182.3c-14.8 21.6-25.1 41.4-30.8 59.4s-9.5 33-11.1 45.1"
            fill="none"
            stroke-linecap="round"
            stroke-width="8"
          />
          <path
            d="m194.9 185.7c-24.4 1.7-43.8 9-58.1 21.8s-24.7 25.4-31.3 37.8"
            fill="none"
            stroke-linecap="round"
            stroke-width="8"
          />
          <path
            d="m204.5 176.4c29.7-6.7 52-8.4 67-5.1s26.9 8.6 35.8 15.9"
            fill="none"
            stroke-linecap="round"
            stroke-width="8"
          />
          <path
            d="m196.5 181.4c20.3 9.9 38.2 20.5 53.9 31.9s27.4 22.1 35.1 32"
            fill="none"
            stroke-linecap="round"
            stroke-width="8"
          />
        </g>
      </g>
      <defs>
        <filter
          id={`al-${id}`}
          x="50.5"
          y="399"
          width="532"
          height="633"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`d-${id}`}
        x="50.5"
        y="399"
        width="532"
        height="633"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#al-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#d-${id})`}>
        <linearGradient
          id={`u-${id}`}
          x1="-666.06"
          x2="-666.23"
          y1="163.36"
          y2="163.75"
          gradientTransform="matrix(532 0 0 633 354760 -102959)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFF400" offset="0" />
          <stop stop-color="#3C8700" offset="1" />
        </linearGradient>

        <ellipse
          cx="316.5"
          cy="715.5"
          rx="266"
          ry="316.5"
          fill={`url(#u-${id})`}
        />
      </g>
      <defs>
        <filter
          id={`ad-${id}`}
          x="391"
          y="-24"
          width="288"
          height="283"
          filterUnits="userSpaceOnUse"
        >
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" />
        </filter>
      </defs>

      <mask
        id={`c-${id}`}
        x="391"
        y="-24"
        width="288"
        height="283"
        maskUnits="userSpaceOnUse"
      >
        <g filter={`url(#ad-${id})`}>
          <circle cx="316.5" cy="316.5" r="316.5" fill="#fff" />
        </g>
      </mask>
      <g mask={`url(#c-${id})`}>
        <linearGradient
          id={`t-${id}`}
          x1="-664.56"
          x2="-664.56"
          y1="163.79"
          y2="164.79"
          gradientTransform="matrix(227 0 0 227 151421 -37204)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFDF00" offset="0" />
          <stop stop-color="#FF9D00" offset="1" />
        </linearGradient>
        <circle cx="565.5" cy="89.5" r="113.5" fill={`url(#t-${id})`} />

        <linearGradient
          id={`v-${id}`}
          x1="-644.5"
          x2="-645.77"
          y1="342"
          y2="342"
          gradientTransform="matrix(30 0 0 1 19770 -253)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="427"
          x2="397"
          y1="89"
          y2="89"
          fill="none"
          stroke={`url(#v-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`aa-${id}`}
          x1="-641.56"
          x2="-642.83"
          y1="196.02"
          y2="196.07"
          gradientTransform="matrix(26.5 0 0 5.5 17439 -1025.5)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="430.5"
          x2="404"
          y1="55.5"
          y2="50"
          fill="none"
          stroke={`url(#aa-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`w-${id}`}
          x1="-643.73"
          x2="-645"
          y1="185.83"
          y2="185.9"
          gradientTransform="matrix(29 0 0 8 19107 -1361)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="431"
          x2="402"
          y1="122"
          y2="130"
          fill="none"
          stroke={`url(#w-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`ac-${id}`}
          x1="-638.94"
          x2="-640.22"
          y1="177.09"
          y2="177.39"
          gradientTransform="matrix(24 0 0 13 15783 -2145)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="442"
          x2="418"
          y1="153"
          y2="166"
          fill="none"
          stroke={`url(#ac-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`ab-${id}`}
          x1="-633.42"
          x2="-634.7"
          y1="172.41"
          y2="173.31"
          gradientTransform="matrix(20 0 0 19 13137 -3096)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="464"
          x2="444"
          y1="180"
          y2="199"
          fill="none"
          stroke={`url(#ab-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`y-${id}`}
          x1="-619.05"
          x2="-619.52"
          y1="170.82"
          y2="171.82"
          gradientTransform="matrix(13.83 0 0 22.85 9050 -3703.4)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="491.4"
          x2="477.5"
          y1="203"
          y2="225.9"
          fill="none"
          stroke={`url(#y-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`x-${id}`}
          x1="-578.5"
          x2="-578.63"
          y1="170.31"
          y2="171.31"
          gradientTransform="matrix(7.5 0 0 24.5 4860 -3953)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="524.5"
          x2="517"
          y1="219.5"
          y2="244"
          fill="none"
          stroke={`url(#x-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />

        <linearGradient
          id={`z-${id}`}
          x1="666.5"
          x2="666.5"
          y1="170.31"
          y2="171.31"
          gradientTransform="matrix(.5 0 0 24.5 231.5 -3944)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#FFA400" offset="0" />
          <stop stop-color="#FF5E00" offset="1" />
        </linearGradient>

        <line
          x1="564.5"
          x2="565"
          y1="228.5"
          y2="253"
          fill="none"
          stroke={`url(#z-${id})`}
          stroke-linecap="round"
          stroke-linejoin="bevel"
          stroke-width="12"
        />
      </g>
    </svg>
  )
}
 */
