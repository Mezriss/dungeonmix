import { Toast } from "@base-ui-components/react/toast";
import { t } from "@lingui/core/macro";
import { useEffect } from "react";
import { errorHandler } from "@/services/errorHandler";

import { X } from "lucide-react";
import styles from "@/styles/ErrorToast.module.css";

export default function ErrorToast() {
  return (
    <Toast.Provider>
      <Toast.Portal>
        <Toast.Viewport className={styles.viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts, add } = Toast.useToastManager();

  useEffect(() => {
    const unsubscribe = errorHandler.subscribe((error) => {
      if (error.message) {
        console.info("adding toast");
        add({
          title: t`Something went wrong`,
          description: error.message,
        });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [add]);

  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={styles.toast}>
      <Toast.Content className={styles.content}>
        <Toast.Title className={styles.title} />
        <Toast.Description className={styles.description} />
        <Toast.Close className={styles.close} aria-label="Close">
          <X className={styles.icon} />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}
