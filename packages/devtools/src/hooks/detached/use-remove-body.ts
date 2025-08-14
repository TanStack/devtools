
import { createEffect } from "solid-js"
import { useStyles } from "../../styles/use-styles"
import type { DevtoolsStore } from "../../context/devtools-store"

export const useRemoveBody = (state: DevtoolsStore) => {
  const styles = useStyles()
  createEffect(() => {
    if (!state.detachedWindow) {
      return
    }

    const coverEl = document.createElement("div")
    coverEl.classList.add(styles().cover)
    document.body.appendChild(coverEl)

  })
}
