'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const crypto = require('crypto');

var timestamps = require('mongoose-timestamp');

var ProjectSchema = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clients'
};

var CameraSchema = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cameras'
};

var TeamSchema = {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'teams'
};

var userSchema = new Schema({
    userId: { type: Number, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    // hashedPassword: {type: String, required: true},                //commented by baimin
    // salt: { type: String, required: true },                        //commented by baimin
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, trim: true },
    active: { type: Number, default: 1 },
    pausedVideoId: { type: Number, default: 0 },
    pausedVideoTime: { type: Number, default: 0 },
    dateCreated: { type: Date, default: Date.now() },
    dateModified: { type: Date, default: Date.now() },
    docIsModified: { type: Boolean, default: true },
    modifiedBy: { type: Number, default: 0 },
    lastLogin: { type: Date, default: Date.now() },
    project: ProjectSchema,
    camera: CameraSchema,
    team: TeamSchema,
    client: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    sessionId: { type: String, default: '' }
});

/**
 * Virtuals
 */
userSchema
    .virtual('password')
    .set(function(password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() {
        return this._password;
    });
/**
 * Methods
 */
userSchema.methods = {

    resetPassword: function(password) {
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    },

    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function() {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function(password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64, null).toString('base64');
    }
};
userSchema.index({ email: 1 });
//userSchema.plugin(timestamps);
mongoose.model('users', userSchema);