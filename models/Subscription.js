/**
 * Subscription model for the emergency alert system
 * Represents a user's subscription to specific alert types/categories
 */
class Subscription {
  constructor(id, userId, categories = [], createdAt = new Date()) {
    this.id = id;
    this.userId = userId;
    this.categories = categories; // ['weather', 'security', 'health', etc.]
    this.createdAt = createdAt;
    this.updatedAt = new Date();
    this.active = true;
  }

  /**
   * Check if the subscription includes a specific category
   * @param {string} category - Category to check
   * @returns {boolean} True if subscribed to the category
   */
  hasCategory(category) {
    return this.categories.includes(category);
  }

  /**
   * Add a category to the subscription
   * @param {string} category - Category to add
   */
  addCategory(category) {
    if (!this.categories.includes(category)) {
      this.categories.push(category);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a category from the subscription
   * @param {string} category - Category to remove
   */
  removeCategory(category) {
    if (this.categories.includes(category)) {
      this.categories = this.categories.filter(cat => cat !== category);
      this.updatedAt = new Date();
    }
  }

  /**
   * Deactivate this subscription
   */
  deactivate() {
    this.active = false;
    this.updatedAt = new Date();
  }

  /**
   * Activate this subscription
   */
  activate() {
    this.active = true;
    this.updatedAt = new Date();
  }
}

module.exports = Subscription;
