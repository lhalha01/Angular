import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: "app-root",
  imports: [RouterModule],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>🔍 Angular Debug Lab</h1>
        <nav class="navigation">
          <a routerLink="/counter" routerLinkActive="active">Counter</a>
          <a routerLink="/users" routerLinkActive="active">Users</a>
        </nav>
      </header>

      <main class="main-content">
        <router-outlet />
      </main>

      <footer class="app-footer">
        <p>Debug App - Angular {{ getAngularVersion() }}</p>
      </footer>
    </div>
  `,
  styleUrls: ["./app.scss"],
})
export class App implements OnInit {
  title = "Debug App";

  ngOnInit(): void {
    console.log("🚀 App Component initialized");
    console.log("🌍 Environment:", this.getEnvironmentInfo());

    // Debug: Información del navegador
    this.logBrowserInfo();

    // Debug: Performance timing
    this.logPerformanceInfo();
  }

  getAngularVersion(): string {
    return "20";
  }

  private getEnvironmentInfo(): object {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
    };
  }

  private logBrowserInfo(): void {
    console.group("🌐 Browser Information");
    console.log("User Agent:", navigator.userAgent);
    console.log("Language:", navigator.language);
    console.log("Platform:", navigator.platform);
    console.log("Screen:", `${screen.width}x${screen.height}`);
    console.log("Viewport:", `${window.innerWidth}x${window.innerHeight}`);
    console.groupEnd();
  }

  private logPerformanceInfo(): void {
    if ("performance" in window) {
      console.group("⚡ Performance Information");
      console.log("Navigation type:", performance.navigation?.type);
      console.log("Redirect count:", performance.navigation?.redirectCount);

      // Timing information
      const timing = performance.timing;
      if (timing) {
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReadyTime =
          timing.domContentLoadedEventEnd - timing.navigationStart;

        console.log("Page load time:", loadTime + "ms");
        console.log("DOM ready time:", domReadyTime + "ms");
      }

      console.groupEnd();
    }
  }
}
