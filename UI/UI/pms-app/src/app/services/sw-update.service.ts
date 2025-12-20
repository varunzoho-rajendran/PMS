import { Injectable, ApplicationRef } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first, interval, concat } from 'rxjs';

/**
 * Service Worker Update Service
 * Handles app updates and caching notifications
 */
@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {
  constructor(
    private swUpdate: SwUpdate,
    private appRef: ApplicationRef
  ) {}

  /**
   * Initialize update checking
   */
  init(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('Service Worker is not enabled');
      return;
    }

    // Check for updates when app stabilizes, then every 6 hours
    const appIsStable$ = this.appRef.isStable.pipe(
      first(isStable => isStable === true)
    );
    const everyThirtyMinutes$ = interval(30 * 60 * 1000); // Check every 30 minutes
    const everyThirtyMinutesOnceAppIsStable$ = concat(appIsStable$, everyThirtyMinutes$);

    everyThirtyMinutesOnceAppIsStable$.subscribe(() => {
      this.swUpdate.checkForUpdate().then(() => {
        console.log('Checked for updates');
      });
    });

    // Listen for version updates
    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(evt => {
        console.log('New version available:', evt);
        this.promptUser();
      });

    // Handle unrecoverable state
    this.swUpdate.unrecoverable.subscribe(event => {
      console.error('Service Worker in unrecoverable state:', event.reason);
      this.notifyUnrecoverableState();
    });
  }

  /**
   * Prompt user to reload for update
   */
  private promptUser(): void {
    const message = 'New version available! Would you like to reload to get the latest features?';
    
    if (confirm(message)) {
      this.swUpdate.activateUpdate().then(() => {
        document.location.reload();
      });
    }
  }

  /**
   * Notify user of unrecoverable state
   */
  private notifyUnrecoverableState(): void {
    const message = 'The application needs to be reloaded due to an error. Click OK to reload.';
    
    if (confirm(message)) {
      document.location.reload();
    }
  }

  /**
   * Manually check for updates
   */
  checkForUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then(updateAvailable => {
        if (updateAvailable) {
          console.log('Update available');
        } else {
          console.log('No update available');
        }
      });
    }
  }

  /**
   * Force activate latest version
   */
  activateUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.activateUpdate().then(() => {
        console.log('Update activated');
        document.location.reload();
      });
    }
  }
}
