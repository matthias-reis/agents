import { Eta } from "eta";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { TemplateData } from "./types.js";

export class TemplateService {
  private eta: Eta;

  constructor() {
    this.eta = new Eta({
      views: join(process.cwd(), "aio", "agent", "templates"),
      cache: false,
    });
  }

  private readTemplate(templateName: string): string {
    const templatePath = join(
      process.cwd(),
      "aio",
      "agent",
      "templates",
      templateName
    );
    try {
      return readFileSync(templatePath, "utf-8");
    } catch (error) {
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  renderBootstrap(data: TemplateData): string {
    const template = this.readTemplate("bootstrap.eta");
    return this.eta.renderString(template, data);
  }

  renderCost(data: TemplateData): string {
    const template = this.readTemplate("cost.eta");
    return this.eta.renderString(template, data);
  }

  renderPlanFeedback(data: TemplateData): string {
    const template = this.readTemplate("plan-feedback.eta");
    return this.eta.renderString(template, data);
  }

  renderPlanApproved(data: TemplateData): string {
    const template = this.readTemplate("plan-approved.eta");
    return this.eta.renderString(template, data);
  }

  renderReviewFeedback(data: TemplateData): string {
    const template = this.readTemplate("review-feedback.eta");
    return this.eta.renderString(template, data);
  }

  renderPrompt(data: TemplateData): string {
    const template = this.readTemplate("prompt.eta");
    return this.eta.renderString(template, data);
  }

  renderQa(data: TemplateData): string {
    const template = this.readTemplate("qa.eta");
    return this.eta.renderString(template, data);
  }

  writeTaskFile(workPackageName: string, content: string): void {
    const filePath = join(process.cwd(), workPackageName, "TASK.md");
    writeFileSync(filePath, content);
  }

  writeCostFile(workPackageName: string, content: string): void {
    const filePath = join(process.cwd(), workPackageName, "cost.md");
    writeFileSync(filePath, content);
  }
}
