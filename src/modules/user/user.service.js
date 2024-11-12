import { UserModel } from './model.js';
import { MediaService } from '../media/media.service.js';
import { logger } from '../../utils/logger.js';

export class UserService {
  constructor() {
    this.mediaService = new MediaService();
  }

  async updateAvatar(userId, file) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error('User not found');

      // Delete existing avatar if any
      if (user.avatar) {
        await this.mediaService.deleteMedia(user.avatar, userId);
      }

      // Upload new avatar
      const { media, uploadUrl } = await this.mediaService.initiateUpload({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        isPublic: true
      }, userId);

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      await this.mediaService.completeUpload(media.id);

      // Update user
      user.avatar = media.id;
      await user.save();

      return media;
    } catch (error) {
      logger.error(`Update avatar error: ${error.message}`);
      throw error;
    }
  }

  async updateBusinessProfile(userId, data) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error('User not found');

      if (data.logo) {
        const { media, uploadUrl } = await this.mediaService.initiateUpload({
          fileName: data.logo.name,
          mimeType: data.logo.type,
          size: data.logo.size,
          isPublic: true
        }, userId);

        await fetch(uploadUrl, {
          method: 'PUT',
          body: data.logo,
          headers: { 'Content-Type': data.logo.type }
        });

        await this.mediaService.completeUpload(media.id);
        user.businessProfile.logo = media.id;
      }

      if (data.banner) {
        const { media, uploadUrl } = await this.mediaService.initiateUpload({
          fileName: data.banner.name,
          mimeType: data.banner.type,
          size: data.banner.size,
          isPublic: true
        }, userId);

        await fetch(uploadUrl, {
          method: 'PUT',
          body: data.banner,
          headers: { 'Content-Type': data.banner.type }
        });

        await this.mediaService.completeUpload(media.id);
        user.businessProfile.banner = media.id;
      }

      if (data.documents) {
        for (const doc of data.documents) {
          const { media, uploadUrl } = await this.mediaService.initiateUpload({
            fileName: doc.file.name,
            mimeType: doc.file.type,
            size: doc.file.size,
            isPublic: false
          }, userId);

          await fetch(uploadUrl, {
            method: 'PUT',
            body: doc.file,
            headers: { 'Content-Type': doc.file.type }
          });

          await this.mediaService.completeUpload(media.id);

          user.businessProfile.documents.push({
            type: doc.type,
            media: media.id
          });
        }
      }

      // Update other business profile fields
      if (data.name) user.businessProfile.name = data.name;
      if (data.description) user.businessProfile.description = data.description;
      if (data.address) user.businessProfile.address = data.address;

      await user.save();
      return user;
    } catch (error) {
      logger.error(`Update business profile error: ${error.message}`);
      throw error;
    }
  }
}