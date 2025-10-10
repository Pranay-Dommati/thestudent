-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: studentshub_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add user',6,'add_user'),(22,'Can change user',6,'change_user'),(23,'Can delete user',6,'delete_user'),(24,'Can view user',6,'view_user'),(25,'Can add email otp',7,'add_emailotp'),(26,'Can change email otp',7,'change_emailotp'),(27,'Can delete email otp',7,'delete_emailotp'),(28,'Can view email otp',7,'view_emailotp'),(29,'Can add course chapter',8,'add_coursechapter'),(30,'Can change course chapter',8,'change_coursechapter'),(31,'Can delete course chapter',8,'delete_coursechapter'),(32,'Can view course chapter',8,'view_coursechapter'),(33,'Can add school course',9,'add_schoolcourse'),(34,'Can change school course',9,'change_schoolcourse'),(35,'Can delete school course',9,'delete_schoolcourse'),(36,'Can view school course',9,'view_schoolcourse'),(37,'Can add engineering course',10,'add_engineeringcourse'),(38,'Can change engineering course',10,'change_engineeringcourse'),(39,'Can delete engineering course',10,'delete_engineeringcourse'),(40,'Can view engineering course',10,'view_engineeringcourse'),(41,'Can add course section',11,'add_coursesection'),(42,'Can change course section',11,'change_coursesection'),(43,'Can delete course section',11,'delete_coursesection'),(44,'Can view course section',11,'view_coursesection'),(45,'Can add lesson',12,'add_lesson'),(46,'Can change lesson',12,'change_lesson'),(47,'Can delete lesson',12,'delete_lesson'),(48,'Can view lesson',12,'view_lesson'),(49,'Can add lesson resource',13,'add_lessonresource'),(50,'Can change lesson resource',13,'change_lessonresource'),(51,'Can delete lesson resource',13,'delete_lessonresource'),(52,'Can view lesson resource',13,'view_lessonresource'),(53,'Can add quiz question',14,'add_quizquestion'),(54,'Can change quiz question',14,'change_quizquestion'),(55,'Can delete quiz question',14,'delete_quizquestion'),(56,'Can view quiz question',14,'view_quizquestion'),(57,'Can add quiz result',15,'add_quizresult'),(58,'Can change quiz result',15,'change_quizresult'),(59,'Can delete quiz result',15,'delete_quizresult'),(60,'Can view quiz result',15,'view_quizresult'),(61,'Can add user lesson progress',16,'add_userlessonprogress'),(62,'Can change user lesson progress',16,'change_userlessonprogress'),(63,'Can delete user lesson progress',16,'delete_userlessonprogress'),(64,'Can view user lesson progress',16,'view_userlessonprogress'),(65,'Can add Pro Learning Course',17,'add_prolearningcourse'),(66,'Can change Pro Learning Course',17,'change_prolearningcourse'),(67,'Can delete Pro Learning Course',17,'delete_prolearningcourse'),(68,'Can view Pro Learning Course',17,'view_prolearningcourse'),(69,'Can add Pro Learning Topic',18,'add_prolearningtopic'),(70,'Can change Pro Learning Topic',18,'change_prolearningtopic'),(71,'Can delete Pro Learning Topic',18,'delete_prolearningtopic'),(72,'Can view Pro Learning Topic',18,'view_prolearningtopic'),(73,'Can add Pro Learning Resource',19,'add_prolearningresource'),(74,'Can change Pro Learning Resource',19,'change_prolearningresource'),(75,'Can delete Pro Learning Resource',19,'delete_prolearningresource'),(76,'Can view Pro Learning Resource',19,'view_prolearningresource'),(77,'Can add Pro Learning Quiz Question',20,'add_prolearningquizquestion'),(78,'Can change Pro Learning Quiz Question',20,'change_prolearningquizquestion'),(79,'Can delete Pro Learning Quiz Question',20,'delete_prolearningquizquestion'),(80,'Can view Pro Learning Quiz Question',20,'view_prolearningquizquestion'),(81,'Can add Pro Learning Video',21,'add_prolearningvideo'),(82,'Can change Pro Learning Video',21,'change_prolearningvideo'),(83,'Can delete Pro Learning Video',21,'delete_prolearningvideo'),(84,'Can view Pro Learning Video',21,'view_prolearningvideo'),(85,'Can add User Started Predefined Course',22,'add_userstartedpredefinedcourse'),(86,'Can change User Started Predefined Course',22,'change_userstartedpredefinedcourse'),(87,'Can delete User Started Predefined Course',22,'delete_userstartedpredefinedcourse'),(88,'Can view User Started Predefined Course',22,'view_userstartedpredefinedcourse'),(89,'Can add Learning Activity',23,'add_learningactivity'),(90,'Can change Learning Activity',23,'change_learningactivity'),(91,'Can delete Learning Activity',23,'delete_learningactivity'),(92,'Can view Learning Activity',23,'view_learningactivity'),(93,'Can add certification',24,'add_certification'),(94,'Can change certification',24,'change_certification'),(95,'Can delete certification',24,'delete_certification'),(96,'Can view certification',24,'view_certification'),(97,'Can add Feedback',25,'add_feedback'),(98,'Can change Feedback',25,'change_feedback'),(99,'Can delete Feedback',25,'delete_feedback'),(100,'Can view Feedback',25,'view_feedback'),(101,'Can add Newsletter Subscription',26,'add_newsletter'),(102,'Can change Newsletter Subscription',26,'change_newsletter'),(103,'Can delete Newsletter Subscription',26,'delete_newsletter'),(104,'Can view Newsletter Subscription',26,'view_newsletter'),(105,'Can add association',27,'add_association'),(106,'Can change association',27,'change_association'),(107,'Can delete association',27,'delete_association'),(108,'Can view association',27,'view_association'),(109,'Can add code',28,'add_code'),(110,'Can change code',28,'change_code'),(111,'Can delete code',28,'delete_code'),(112,'Can view code',28,'view_code'),(113,'Can add nonce',29,'add_nonce'),(114,'Can change nonce',29,'change_nonce'),(115,'Can delete nonce',29,'delete_nonce'),(116,'Can view nonce',29,'view_nonce'),(117,'Can add user social auth',30,'add_usersocialauth'),(118,'Can change user social auth',30,'change_usersocialauth'),(119,'Can delete user social auth',30,'delete_usersocialauth'),(120,'Can view user social auth',30,'view_usersocialauth'),(121,'Can add partial',31,'add_partial'),(122,'Can change partial',31,'change_partial'),(123,'Can delete partial',31,'delete_partial'),(124,'Can view partial',31,'view_partial'),(125,'Can add user activity',32,'add_useractivity'),(126,'Can change user activity',32,'change_useractivity'),(127,'Can delete user activity',32,'delete_useractivity'),(128,'Can view user activity',32,'view_useractivity');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authentication_emailotp`
--

DROP TABLE IF EXISTS `authentication_emailotp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authentication_emailotp` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `is_used` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `last_sent_at` datetime(6) NOT NULL,
  `resend_count` int unsigned NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_otp_user_state` (`user_id`,`is_used`,`expires_at`),
  KEY `idx_otp_created_at` (`created_at`),
  CONSTRAINT `authentication_email_user_id_4a65984d_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`),
  CONSTRAINT `authentication_emailotp_chk_1` CHECK ((`resend_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authentication_emailotp`
--

LOCK TABLES `authentication_emailotp` WRITE;
/*!40000 ALTER TABLE `authentication_emailotp` DISABLE KEYS */;
/*!40000 ALTER TABLE `authentication_emailotp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authentication_user`
--

DROP TABLE IF EXISTS `authentication_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authentication_user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `agreed_to_terms` tinyint(1) NOT NULL,
  `auth_method` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authentication_user`
--

LOCK TABLES `authentication_user` WRITE;
/*!40000 ALTER TABLE `authentication_user` DISABLE KEYS */;
INSERT INTO `authentication_user` VALUES (1,'pbkdf2_sha256$870000$vIpmhQLlZ8Ss4a5l0wRLAr$pXhkzH0n0ypwOHhByP7ufsW4gylxPSvfP6JZXG6jeZ4=',NULL,1,'','',1,1,'nagaraj@gmail.com','nagaraj','2025-08-06 09:47:52.859000','2025-08-06 09:47:52.859000',0,'email'),(2,'!RK2sJcPyBjuYMYD3Z49u36HwjHVWTf1UE1MSSNpF',NULL,0,'','',0,1,'bannydommati@gmail.com','Pranay Dommati','2025-08-06 09:50:32.087000','2025-08-06 09:50:32.087000',1,'google');
/*!40000 ALTER TABLE `authentication_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authentication_user_groups`
--

DROP TABLE IF EXISTS `authentication_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authentication_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_groups_user_id_group_id_8af031ac_uniq` (`user_id`,`group_id`),
  KEY `authentication_user_groups_group_id_6b5c44b7_fk_auth_group_id` (`group_id`),
  CONSTRAINT `authentication_user__user_id_30868577_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`),
  CONSTRAINT `authentication_user_groups_group_id_6b5c44b7_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authentication_user_groups`
--

LOCK TABLES `authentication_user_groups` WRITE;
/*!40000 ALTER TABLE `authentication_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `authentication_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `authentication_user_user_permissions`
--

DROP TABLE IF EXISTS `authentication_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authentication_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_user_user_user_id_permission_id_ec51b09f_uniq` (`user_id`,`permission_id`),
  KEY `authentication_user__permission_id_ea6be19a_fk_auth_perm` (`permission_id`),
  CONSTRAINT `authentication_user__permission_id_ea6be19a_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `authentication_user__user_id_736ebf7e_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `authentication_user_user_permissions`
--

LOCK TABLES `authentication_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `authentication_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `authentication_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_certification`
--

DROP TABLE IF EXISTS `courses_certification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_certification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `certificate_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issued_at` datetime(6) NOT NULL,
  `file` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_id` (`certificate_id`),
  UNIQUE KEY `courses_certification_user_id_course_id_61fda7f7_uniq` (`user_id`,`course_id`),
  KEY `courses_certificatio_course_id_c3513150_fk_courses_e` (`course_id`),
  CONSTRAINT `courses_certificatio_course_id_c3513150_fk_courses_e` FOREIGN KEY (`course_id`) REFERENCES `courses_engineeringcourse` (`id`),
  CONSTRAINT `courses_certification_user_id_a6d83d8c_fk_authentication_user_id` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_certification`
--

LOCK TABLES `courses_certification` WRITE;
/*!40000 ALTER TABLE `courses_certification` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_certification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_coursechapter`
--

DROP TABLE IF EXISTS `courses_coursechapter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_coursechapter` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int unsigned NOT NULL,
  `school_course_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_coursechapte_school_course_id_a1fdf00b_fk_courses_s` (`school_course_id`),
  CONSTRAINT `courses_coursechapte_school_course_id_a1fdf00b_fk_courses_s` FOREIGN KEY (`school_course_id`) REFERENCES `courses_schoolcourse` (`id`),
  CONSTRAINT `courses_coursechapter_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_coursechapter`
--

LOCK TABLES `courses_coursechapter` WRITE;
/*!40000 ALTER TABLE `courses_coursechapter` DISABLE KEYS */;
INSERT INTO `courses_coursechapter` VALUES (1,'Chapter 1: Mathematics Fundamentals 1',1,'d5d03b0a49a6419dbb0bf258192cc300'),(2,'Chapter 2: Mathematics Fundamentals 2',2,'d5d03b0a49a6419dbb0bf258192cc300'),(3,'Chapter 3: Mathematics Fundamentals 3',3,'d5d03b0a49a6419dbb0bf258192cc300'),(4,'Chapter 1: Mathematics Fundamentals 1',1,'143f064c2e4f499bab07958f895ba351'),(5,'Chapter 2: Mathematics Fundamentals 2',2,'143f064c2e4f499bab07958f895ba351'),(6,'Chapter 1: Mathematics Fundamentals 1',1,'3e84fb3ea30e41608ac96f74de27eab6'),(7,'Chapter 2: Mathematics Fundamentals 2',2,'3e84fb3ea30e41608ac96f74de27eab6'),(8,'Chapter 1: Science Fundamentals 1',1,'1f812a4886ad479eaa17f83b07777628'),(9,'Chapter 2: Science Fundamentals 2',2,'1f812a4886ad479eaa17f83b07777628'),(10,'Chapter 3: Science Fundamentals 3',3,'1f812a4886ad479eaa17f83b07777628'),(11,'Chapter 1: Science Fundamentals 1',1,'df7685ec795f4984a6abd480a9c28cee'),(12,'Chapter 2: Science Fundamentals 2',2,'df7685ec795f4984a6abd480a9c28cee'),(13,'Chapter 1: Science Fundamentals 1',1,'8787bd0ac9494d43b8542a8517f40984'),(14,'Chapter 2: Science Fundamentals 2',2,'8787bd0ac9494d43b8542a8517f40984'),(15,'Chapter 1: English Fundamentals 1',1,'6607096986c24e8385c91e41b61173ec'),(16,'Chapter 2: English Fundamentals 2',2,'6607096986c24e8385c91e41b61173ec'),(17,'Chapter 3: English Fundamentals 3',3,'6607096986c24e8385c91e41b61173ec'),(18,'Chapter 1: English Fundamentals 1',1,'b8c0a11db981472a8bc6cbee4d5e3011'),(19,'Chapter 2: English Fundamentals 2',2,'b8c0a11db981472a8bc6cbee4d5e3011'),(20,'Chapter 1: English Fundamentals 1',1,'d1f0e610e45f4c8392cc7bb7d5b6a38c'),(21,'Chapter 2: English Fundamentals 2',2,'d1f0e610e45f4c8392cc7bb7d5b6a38c'),(22,'Chapter 1: Hindi Fundamentals 1',1,'152c8a814b8e4a45927d6c0eb780ddcb'),(23,'Chapter 2: Hindi Fundamentals 2',2,'152c8a814b8e4a45927d6c0eb780ddcb'),(24,'Chapter 3: Hindi Fundamentals 3',3,'152c8a814b8e4a45927d6c0eb780ddcb'),(25,'Chapter 1: Hindi Fundamentals 1',1,'52c494a4a20846f8afccc56c063b81a2'),(26,'Chapter 2: Hindi Fundamentals 2',2,'52c494a4a20846f8afccc56c063b81a2'),(27,'Chapter 1: Hindi Fundamentals 1',1,'4a63d31dd502450e99e55e4e17b1fa47'),(28,'Chapter 2: Hindi Fundamentals 2',2,'4a63d31dd502450e99e55e4e17b1fa47'),(29,'Chapter 1: Social Science Fundamentals 1',1,'9a5ec7fb91854a1f97150edf2339e005'),(30,'Chapter 2: Social Science Fundamentals 2',2,'9a5ec7fb91854a1f97150edf2339e005'),(31,'Chapter 3: Social Science Fundamentals 3',3,'9a5ec7fb91854a1f97150edf2339e005'),(32,'Chapter 1: Social Science Fundamentals 1',1,'1c0339a0931a4fb49509467f16717374'),(33,'Chapter 2: Social Science Fundamentals 2',2,'1c0339a0931a4fb49509467f16717374'),(34,'Chapter 1: Social Science Fundamentals 1',1,'b9f7caaf1cdc4ac8a099084b3fd38a36'),(35,'Chapter 2: Social Science Fundamentals 2',2,'b9f7caaf1cdc4ac8a099084b3fd38a36'),(36,'Chapter 1: Mathematics Fundamentals 1',1,'6fd35d8dd5a448378ceeba32c4851dba'),(37,'Chapter 2: Mathematics Fundamentals 2',2,'6fd35d8dd5a448378ceeba32c4851dba'),(38,'Chapter 3: Mathematics Fundamentals 3',3,'6fd35d8dd5a448378ceeba32c4851dba'),(39,'Chapter 1: Mathematics Fundamentals 1',1,'b3c489b0b4b2455ea177dafd18c3d737'),(40,'Chapter 2: Mathematics Fundamentals 2',2,'b3c489b0b4b2455ea177dafd18c3d737'),(41,'Chapter 1: Mathematics Fundamentals 1',1,'33add8b5bb43429a92df8b58aa9d6666'),(42,'Chapter 2: Mathematics Fundamentals 2',2,'33add8b5bb43429a92df8b58aa9d6666'),(43,'Chapter 1: Science Fundamentals 1',1,'04712ae804bf4a43b7bf680dcd1e62f3'),(44,'Chapter 2: Science Fundamentals 2',2,'04712ae804bf4a43b7bf680dcd1e62f3'),(45,'Chapter 3: Science Fundamentals 3',3,'04712ae804bf4a43b7bf680dcd1e62f3'),(46,'Chapter 1: Science Fundamentals 1',1,'0263526064ec43a4aece653ad8452c4d'),(47,'Chapter 2: Science Fundamentals 2',2,'0263526064ec43a4aece653ad8452c4d'),(48,'Chapter 1: Science Fundamentals 1',1,'92f1388baa63412ab2502f5981439991'),(49,'Chapter 2: Science Fundamentals 2',2,'92f1388baa63412ab2502f5981439991'),(50,'Chapter 1: English Fundamentals 1',1,'08d932a7c4034921b1d84ddcdaef65b9'),(51,'Chapter 2: English Fundamentals 2',2,'08d932a7c4034921b1d84ddcdaef65b9'),(52,'Chapter 3: English Fundamentals 3',3,'08d932a7c4034921b1d84ddcdaef65b9'),(53,'Chapter 1: English Fundamentals 1',1,'3f05dabd85ca4f969590d75fca088a7e'),(54,'Chapter 2: English Fundamentals 2',2,'3f05dabd85ca4f969590d75fca088a7e'),(55,'Chapter 1: English Fundamentals 1',1,'db5652e4b7e64625a4c7ccd89e218aea'),(56,'Chapter 2: English Fundamentals 2',2,'db5652e4b7e64625a4c7ccd89e218aea'),(57,'Chapter 1: Hindi Fundamentals 1',1,'8c0bddf9b3a748e3be9c86626ac068bd'),(58,'Chapter 2: Hindi Fundamentals 2',2,'8c0bddf9b3a748e3be9c86626ac068bd'),(59,'Chapter 3: Hindi Fundamentals 3',3,'8c0bddf9b3a748e3be9c86626ac068bd'),(60,'Chapter 1: Hindi Fundamentals 1',1,'e6bf3dd4b2cc4fd6b0720fcf57736a76'),(61,'Chapter 2: Hindi Fundamentals 2',2,'e6bf3dd4b2cc4fd6b0720fcf57736a76'),(62,'Chapter 1: Hindi Fundamentals 1',1,'9a5a2c7798884a19abb9d8a85055cf0a'),(63,'Chapter 2: Hindi Fundamentals 2',2,'9a5a2c7798884a19abb9d8a85055cf0a'),(64,'Chapter 1: Social Science Fundamentals 1',1,'2b774408fa0548899178e928d08d3011'),(65,'Chapter 2: Social Science Fundamentals 2',2,'2b774408fa0548899178e928d08d3011'),(66,'Chapter 3: Social Science Fundamentals 3',3,'2b774408fa0548899178e928d08d3011'),(67,'Chapter 1: Social Science Fundamentals 1',1,'5ead663fbc5049619429eccc067b29d1'),(68,'Chapter 2: Social Science Fundamentals 2',2,'5ead663fbc5049619429eccc067b29d1'),(69,'Chapter 1: Social Science Fundamentals 1',1,'60a0760ed19747279215eb1888166c63'),(70,'Chapter 2: Social Science Fundamentals 2',2,'60a0760ed19747279215eb1888166c63'),(71,'Chapter 1: Mathematics Fundamentals 1',1,'2c5f5fb2e5934612aeb4d2cbe7218baa'),(72,'Chapter 2: Mathematics Fundamentals 2',2,'2c5f5fb2e5934612aeb4d2cbe7218baa'),(73,'Chapter 3: Mathematics Fundamentals 3',3,'2c5f5fb2e5934612aeb4d2cbe7218baa'),(74,'Chapter 1: Mathematics Fundamentals 1',1,'cf5d7f424860401294d680342d0b7105'),(75,'Chapter 2: Mathematics Fundamentals 2',2,'cf5d7f424860401294d680342d0b7105'),(76,'Chapter 1: Mathematics Fundamentals 1',1,'fb518b27bb2a4ba5bd6012f2e1b05a5a'),(77,'Chapter 2: Mathematics Fundamentals 2',2,'fb518b27bb2a4ba5bd6012f2e1b05a5a'),(78,'Chapter 1: Science Fundamentals 1',1,'bb88413cf1834aa0ba0fb7d27c68b113'),(79,'Chapter 2: Science Fundamentals 2',2,'bb88413cf1834aa0ba0fb7d27c68b113'),(80,'Chapter 3: Science Fundamentals 3',3,'bb88413cf1834aa0ba0fb7d27c68b113'),(81,'Chapter 1: Science Fundamentals 1',1,'3a5acc63739242bf80e1b39e4d6e42c8'),(82,'Chapter 2: Science Fundamentals 2',2,'3a5acc63739242bf80e1b39e4d6e42c8'),(83,'Chapter 1: Science Fundamentals 1',1,'8cb3ce3fe84c433ab0f56718d38e0075'),(84,'Chapter 2: Science Fundamentals 2',2,'8cb3ce3fe84c433ab0f56718d38e0075'),(85,'Chapter 1: English Fundamentals 1',1,'cf991bade55e4c8f8c235e38e4eb3c3e'),(86,'Chapter 2: English Fundamentals 2',2,'cf991bade55e4c8f8c235e38e4eb3c3e'),(87,'Chapter 3: English Fundamentals 3',3,'cf991bade55e4c8f8c235e38e4eb3c3e'),(88,'Chapter 1: English Fundamentals 1',1,'9be84648116d4b52a6e9fed50d399145'),(89,'Chapter 2: English Fundamentals 2',2,'9be84648116d4b52a6e9fed50d399145'),(90,'Chapter 1: English Fundamentals 1',1,'ba2a49b878054d5bbd273aed19dd87b6'),(91,'Chapter 2: English Fundamentals 2',2,'ba2a49b878054d5bbd273aed19dd87b6'),(92,'Chapter 1: Hindi Fundamentals 1',1,'3c72241765d544a396c4b5744f72b4f5'),(93,'Chapter 2: Hindi Fundamentals 2',2,'3c72241765d544a396c4b5744f72b4f5'),(94,'Chapter 3: Hindi Fundamentals 3',3,'3c72241765d544a396c4b5744f72b4f5'),(95,'Chapter 1: Hindi Fundamentals 1',1,'6dc63a49712c4e7da5559df1c796a6f1'),(96,'Chapter 2: Hindi Fundamentals 2',2,'6dc63a49712c4e7da5559df1c796a6f1'),(97,'Chapter 1: Hindi Fundamentals 1',1,'51d457c075ff46958df414a857ca8123'),(98,'Chapter 2: Hindi Fundamentals 2',2,'51d457c075ff46958df414a857ca8123'),(99,'Chapter 1: Social Science Fundamentals 1',1,'4391376c912d4826adda23354cd29c66'),(100,'Chapter 2: Social Science Fundamentals 2',2,'4391376c912d4826adda23354cd29c66'),(101,'Chapter 3: Social Science Fundamentals 3',3,'4391376c912d4826adda23354cd29c66'),(102,'Chapter 1: Social Science Fundamentals 1',1,'959c1124e00446568159e4fc6f6a548f'),(103,'Chapter 2: Social Science Fundamentals 2',2,'959c1124e00446568159e4fc6f6a548f'),(104,'Chapter 1: Social Science Fundamentals 1',1,'538d64a3d6ab40928b90b60527d3b693'),(105,'Chapter 2: Social Science Fundamentals 2',2,'538d64a3d6ab40928b90b60527d3b693'),(106,'Chapter 1: Mathematics Fundamentals 1',1,'4cc067aa4c65419cb2b3c112afa5d7ad'),(107,'Chapter 2: Mathematics Fundamentals 2',2,'4cc067aa4c65419cb2b3c112afa5d7ad'),(108,'Chapter 3: Mathematics Fundamentals 3',3,'4cc067aa4c65419cb2b3c112afa5d7ad'),(109,'Chapter 1: Mathematics Fundamentals 1',1,'b30dec6136414b449c59ea5247457a5e'),(110,'Chapter 2: Mathematics Fundamentals 2',2,'b30dec6136414b449c59ea5247457a5e'),(111,'Chapter 1: Mathematics Fundamentals 1',1,'cc7e5d5b927d47a79f9c8c27192e589b'),(112,'Chapter 2: Mathematics Fundamentals 2',2,'cc7e5d5b927d47a79f9c8c27192e589b'),(113,'Chapter 1: Science Fundamentals 1',1,'5e9e79ceb179436bbb21c1c114b7cef9'),(114,'Chapter 2: Science Fundamentals 2',2,'5e9e79ceb179436bbb21c1c114b7cef9'),(115,'Chapter 3: Science Fundamentals 3',3,'5e9e79ceb179436bbb21c1c114b7cef9'),(116,'Chapter 1: Science Fundamentals 1',1,'9c8b582d2eef45f68d56008003de94e1'),(117,'Chapter 2: Science Fundamentals 2',2,'9c8b582d2eef45f68d56008003de94e1'),(118,'Chapter 1: Science Fundamentals 1',1,'bad86465fe9f4f4cbde31176a7946e60'),(119,'Chapter 2: Science Fundamentals 2',2,'bad86465fe9f4f4cbde31176a7946e60'),(120,'Chapter 1: English Fundamentals 1',1,'1b94a8e4a46744118a111f5cb0165c2d'),(121,'Chapter 2: English Fundamentals 2',2,'1b94a8e4a46744118a111f5cb0165c2d'),(122,'Chapter 3: English Fundamentals 3',3,'1b94a8e4a46744118a111f5cb0165c2d'),(123,'Chapter 1: English Fundamentals 1',1,'97a12c22235042178869a1436e028207'),(124,'Chapter 2: English Fundamentals 2',2,'97a12c22235042178869a1436e028207'),(125,'Chapter 1: English Fundamentals 1',1,'5e4fcfaa29b14fcaab1ff4f772d0e619'),(126,'Chapter 2: English Fundamentals 2',2,'5e4fcfaa29b14fcaab1ff4f772d0e619'),(127,'Chapter 1: Hindi Fundamentals 1',1,'471e82e92786479392fe5860629c7b96'),(128,'Chapter 2: Hindi Fundamentals 2',2,'471e82e92786479392fe5860629c7b96'),(129,'Chapter 3: Hindi Fundamentals 3',3,'471e82e92786479392fe5860629c7b96'),(130,'Chapter 1: Hindi Fundamentals 1',1,'d1e98753083f4bd48ad2e67cbcbf2b08'),(131,'Chapter 2: Hindi Fundamentals 2',2,'d1e98753083f4bd48ad2e67cbcbf2b08'),(132,'Chapter 1: Hindi Fundamentals 1',1,'a7fbc8b62f924227822a86f5de6da785'),(133,'Chapter 2: Hindi Fundamentals 2',2,'a7fbc8b62f924227822a86f5de6da785'),(134,'Chapter 1: Social Science Fundamentals 1',1,'1399abf1f9cb4d868c4a2a5b3a4d2a2b'),(135,'Chapter 2: Social Science Fundamentals 2',2,'1399abf1f9cb4d868c4a2a5b3a4d2a2b'),(136,'Chapter 3: Social Science Fundamentals 3',3,'1399abf1f9cb4d868c4a2a5b3a4d2a2b'),(137,'Chapter 1: Social Science Fundamentals 1',1,'e8b46bf7c74f4a29bbbf3e6f18dac8ad'),(138,'Chapter 2: Social Science Fundamentals 2',2,'e8b46bf7c74f4a29bbbf3e6f18dac8ad'),(139,'Chapter 1: Social Science Fundamentals 1',1,'4229a23d77834be49264688ef31e635b'),(140,'Chapter 2: Social Science Fundamentals 2',2,'4229a23d77834be49264688ef31e635b');
/*!40000 ALTER TABLE `courses_coursechapter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_coursesection`
--

DROP TABLE IF EXISTS `courses_coursesection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_coursesection` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int unsigned NOT NULL,
  `engineering_course_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_coursesectio_engineering_course_i_6eb2f22e_fk_courses_e` (`engineering_course_id`),
  CONSTRAINT `courses_coursesectio_engineering_course_i_6eb2f22e_fk_courses_e` FOREIGN KEY (`engineering_course_id`) REFERENCES `courses_engineeringcourse` (`id`),
  CONSTRAINT `courses_coursesection_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_coursesection`
--

LOCK TABLES `courses_coursesection` WRITE;
/*!40000 ALTER TABLE `courses_coursesection` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_coursesection` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_engineeringcourse`
--

DROP TABLE IF EXISTS `courses_engineeringcourse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_engineeringcourse` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_updated` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_published` tinyint(1) NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sources` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proficiency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_given` tinyint(1) NOT NULL,
  `project_based` tinyint(1) NOT NULL,
  `learning_points` json DEFAULT NULL,
  `requirements` json DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_engineeringc_user_id_69106cf0_fk_authentic` (`user_id`),
  CONSTRAINT `courses_engineeringc_user_id_69106cf0_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_engineeringcourse`
--

LOCK TABLES `courses_engineeringcourse` WRITE;
/*!40000 ALTER TABLE `courses_engineeringcourse` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_engineeringcourse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_learningactivity`
--

DROP TABLE IF EXISTS `courses_learningactivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_learningactivity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `time_spent_minutes` int unsigned NOT NULL,
  `sessions_count` int unsigned NOT NULL,
  `last_activity` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_learningactivity_user_id_date_8665f2e9_uniq` (`user_id`,`date`),
  CONSTRAINT `courses_learningacti_user_id_126a1340_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`),
  CONSTRAINT `courses_learningactivity_chk_1` CHECK ((`time_spent_minutes` >= 0)),
  CONSTRAINT `courses_learningactivity_chk_2` CHECK ((`sessions_count` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_learningactivity`
--

LOCK TABLES `courses_learningactivity` WRITE;
/*!40000 ALTER TABLE `courses_learningactivity` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_learningactivity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_lesson`
--

DROP TABLE IF EXISTS `courses_lesson`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_lesson` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `about_lesson` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int unsigned NOT NULL,
  `chapter_id` bigint DEFAULT NULL,
  `section_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_lesson_chapter_id_401d021a_fk_courses_coursechapter_id` (`chapter_id`),
  KEY `courses_lesson_section_id_fe288d16_fk_courses_coursesection_id` (`section_id`),
  CONSTRAINT `courses_lesson_chapter_id_401d021a_fk_courses_coursechapter_id` FOREIGN KEY (`chapter_id`) REFERENCES `courses_coursechapter` (`id`),
  CONSTRAINT `courses_lesson_section_id_fe288d16_fk_courses_coursesection_id` FOREIGN KEY (`section_id`) REFERENCES `courses_coursesection` (`id`),
  CONSTRAINT `courses_lesson_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=281 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_lesson`
--

LOCK TABLES `courses_lesson` WRITE;
/*!40000 ALTER TABLE `courses_lesson` DISABLE KEYS */;
INSERT INTO `courses_lesson` VALUES (1,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,1,NULL),(2,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,1,NULL),(3,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,2,NULL),(4,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,2,NULL),(5,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,3,NULL),(6,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,3,NULL),(7,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,4,NULL),(8,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,4,NULL),(9,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,5,NULL),(10,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,5,NULL),(11,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,6,NULL),(12,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,6,NULL),(13,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,7,NULL),(14,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,7,NULL),(15,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,8,NULL),(16,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,8,NULL),(17,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,9,NULL),(18,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,9,NULL),(19,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,10,NULL),(20,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,10,NULL),(21,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,11,NULL),(22,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,11,NULL),(23,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,12,NULL),(24,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,12,NULL),(25,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,13,NULL),(26,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,13,NULL),(27,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,14,NULL),(28,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,14,NULL),(29,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,15,NULL),(30,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,15,NULL),(31,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,16,NULL),(32,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,16,NULL),(33,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,17,NULL),(34,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,17,NULL),(35,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,18,NULL),(36,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,18,NULL),(37,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,19,NULL),(38,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,19,NULL),(39,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,20,NULL),(40,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,20,NULL),(41,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,21,NULL),(42,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,21,NULL),(43,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,22,NULL),(44,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,22,NULL),(45,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,23,NULL),(46,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,23,NULL),(47,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,24,NULL),(48,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,24,NULL),(49,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,25,NULL),(50,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,25,NULL),(51,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,26,NULL),(52,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,26,NULL),(53,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,27,NULL),(54,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,27,NULL),(55,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,28,NULL),(56,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,28,NULL),(57,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,29,NULL),(58,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,29,NULL),(59,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,30,NULL),(60,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,30,NULL),(61,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,31,NULL),(62,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,31,NULL),(63,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,32,NULL),(64,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,32,NULL),(65,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,33,NULL),(66,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,33,NULL),(67,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,34,NULL),(68,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,34,NULL),(69,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,35,NULL),(70,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,35,NULL),(71,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,36,NULL),(72,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,36,NULL),(73,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,37,NULL),(74,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,37,NULL),(75,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,38,NULL),(76,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,38,NULL),(77,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,39,NULL),(78,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,39,NULL),(79,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,40,NULL),(80,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,40,NULL),(81,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,41,NULL),(82,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,41,NULL),(83,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,42,NULL),(84,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,42,NULL),(85,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,43,NULL),(86,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,43,NULL),(87,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,44,NULL),(88,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,44,NULL),(89,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,45,NULL),(90,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,45,NULL),(91,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,46,NULL),(92,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,46,NULL),(93,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,47,NULL),(94,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,47,NULL),(95,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,48,NULL),(96,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,48,NULL),(97,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,49,NULL),(98,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,49,NULL),(99,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,50,NULL),(100,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,50,NULL),(101,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,51,NULL),(102,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,51,NULL),(103,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,52,NULL),(104,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,52,NULL),(105,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,53,NULL),(106,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,53,NULL),(107,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,54,NULL),(108,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,54,NULL),(109,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,55,NULL),(110,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,55,NULL),(111,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,56,NULL),(112,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,56,NULL),(113,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,57,NULL),(114,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,57,NULL),(115,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,58,NULL),(116,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,58,NULL),(117,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,59,NULL),(118,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,59,NULL),(119,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,60,NULL),(120,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,60,NULL),(121,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,61,NULL),(122,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,61,NULL),(123,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,62,NULL),(124,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,62,NULL),(125,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,63,NULL),(126,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,63,NULL),(127,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,64,NULL),(128,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,64,NULL),(129,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,65,NULL),(130,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,65,NULL),(131,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,66,NULL),(132,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,66,NULL),(133,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,67,NULL),(134,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,67,NULL),(135,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,68,NULL),(136,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,68,NULL),(137,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,69,NULL),(138,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,69,NULL),(139,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,70,NULL),(140,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,70,NULL),(141,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,71,NULL),(142,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,71,NULL),(143,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,72,NULL),(144,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,72,NULL),(145,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,73,NULL),(146,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,73,NULL),(147,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,74,NULL),(148,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,74,NULL),(149,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,75,NULL),(150,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,75,NULL),(151,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,76,NULL),(152,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,76,NULL),(153,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,77,NULL),(154,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,77,NULL),(155,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,78,NULL),(156,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,78,NULL),(157,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,79,NULL),(158,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,79,NULL),(159,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,80,NULL),(160,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,80,NULL),(161,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,81,NULL),(162,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,81,NULL),(163,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,82,NULL),(164,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,82,NULL),(165,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,83,NULL),(166,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,83,NULL),(167,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,84,NULL),(168,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,84,NULL),(169,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,85,NULL),(170,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,85,NULL),(171,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,86,NULL),(172,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,86,NULL),(173,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,87,NULL),(174,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,87,NULL),(175,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,88,NULL),(176,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,88,NULL),(177,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,89,NULL),(178,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,89,NULL),(179,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,90,NULL),(180,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,90,NULL),(181,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,91,NULL),(182,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,91,NULL),(183,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,92,NULL),(184,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,92,NULL),(185,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,93,NULL),(186,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,93,NULL),(187,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,94,NULL),(188,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,94,NULL),(189,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,95,NULL),(190,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,95,NULL),(191,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,96,NULL),(192,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,96,NULL),(193,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,97,NULL),(194,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,97,NULL),(195,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,98,NULL),(196,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,98,NULL),(197,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,99,NULL),(198,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,99,NULL),(199,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,100,NULL),(200,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,100,NULL),(201,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,101,NULL),(202,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,101,NULL),(203,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,102,NULL),(204,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,102,NULL),(205,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,103,NULL),(206,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,103,NULL),(207,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,104,NULL),(208,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,104,NULL),(209,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,105,NULL),(210,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,105,NULL),(211,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,106,NULL),(212,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,106,NULL),(213,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,107,NULL),(214,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,107,NULL),(215,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,108,NULL),(216,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,108,NULL),(217,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,109,NULL),(218,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,109,NULL),(219,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,110,NULL),(220,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,110,NULL),(221,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,111,NULL),(222,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,111,NULL),(223,'Lesson 1: Introduction to Mathematics Part 1','video','','Learn the basics of Mathematics in this comprehensive lesson','',1,112,NULL),(224,'Lesson 2: Introduction to Mathematics Part 2','video','','Learn the basics of Mathematics in this comprehensive lesson','',2,112,NULL),(225,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,113,NULL),(226,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,113,NULL),(227,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,114,NULL),(228,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,114,NULL),(229,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,115,NULL),(230,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,115,NULL),(231,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,116,NULL),(232,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,116,NULL),(233,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,117,NULL),(234,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,117,NULL),(235,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,118,NULL),(236,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,118,NULL),(237,'Lesson 1: Introduction to Science Part 1','video','','Learn the basics of Science in this comprehensive lesson','',1,119,NULL),(238,'Lesson 2: Introduction to Science Part 2','video','','Learn the basics of Science in this comprehensive lesson','',2,119,NULL),(239,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,120,NULL),(240,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,120,NULL),(241,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,121,NULL),(242,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,121,NULL),(243,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,122,NULL),(244,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,122,NULL),(245,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,123,NULL),(246,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,123,NULL),(247,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,124,NULL),(248,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,124,NULL),(249,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,125,NULL),(250,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,125,NULL),(251,'Lesson 1: Introduction to English Part 1','video','','Learn the basics of English in this comprehensive lesson','',1,126,NULL),(252,'Lesson 2: Introduction to English Part 2','video','','Learn the basics of English in this comprehensive lesson','',2,126,NULL),(253,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,127,NULL),(254,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,127,NULL),(255,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,128,NULL),(256,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,128,NULL),(257,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,129,NULL),(258,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,129,NULL),(259,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,130,NULL),(260,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,130,NULL),(261,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,131,NULL),(262,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,131,NULL),(263,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,132,NULL),(264,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,132,NULL),(265,'Lesson 1: Introduction to Hindi Part 1','video','','Learn the basics of Hindi in this comprehensive lesson','',1,133,NULL),(266,'Lesson 2: Introduction to Hindi Part 2','video','','Learn the basics of Hindi in this comprehensive lesson','',2,133,NULL),(267,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,134,NULL),(268,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,134,NULL),(269,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,135,NULL),(270,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,135,NULL),(271,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,136,NULL),(272,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,136,NULL),(273,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,137,NULL),(274,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,137,NULL),(275,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,138,NULL),(276,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,138,NULL),(277,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,139,NULL),(278,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,139,NULL),(279,'Lesson 1: Introduction to Social Science Part 1','video','','Learn the basics of Social Science in this comprehensive lesson','',1,140,NULL),(280,'Lesson 2: Introduction to Social Science Part 2','video','','Learn the basics of Social Science in this comprehensive lesson','',2,140,NULL);
/*!40000 ALTER TABLE `courses_lesson` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_lessonresource`
--

DROP TABLE IF EXISTS `courses_lessonresource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_lessonresource` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lesson_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_lessonresource_lesson_id_8c9d4f54_fk_courses_lesson_id` (`lesson_id`),
  CONSTRAINT `courses_lessonresource_lesson_id_8c9d4f54_fk_courses_lesson_id` FOREIGN KEY (`lesson_id`) REFERENCES `courses_lesson` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_lessonresource`
--

LOCK TABLES `courses_lessonresource` WRITE;
/*!40000 ALTER TABLE `courses_lessonresource` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_lessonresource` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_prolearningcourse`
--

DROP TABLE IF EXISTS `courses_prolearningcourse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_prolearningcourse` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `is_completed` tinyint(1) NOT NULL,
  `completion_percentage` decimal(5,2) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_prolearningc_user_id_c20346b7_fk_authentic` (`user_id`),
  CONSTRAINT `courses_prolearningc_user_id_c20346b7_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_prolearningcourse`
--

LOCK TABLES `courses_prolearningcourse` WRITE;
/*!40000 ALTER TABLE `courses_prolearningcourse` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_prolearningcourse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_prolearningquizquestion`
--

DROP TABLE IF EXISTS `courses_prolearningquizquestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_prolearningquizquestion` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_text` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json NOT NULL,
  `correct_answer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `explanation` longtext COLLATE utf8mb4_unicode_ci,
  `points` int unsigned NOT NULL,
  `order` int unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `topic_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_prolearningq_topic_id_f79b988b_fk_courses_p` (`topic_id`),
  CONSTRAINT `courses_prolearningq_topic_id_f79b988b_fk_courses_p` FOREIGN KEY (`topic_id`) REFERENCES `courses_prolearningtopic` (`id`),
  CONSTRAINT `courses_prolearningquizquestion_chk_1` CHECK ((`points` >= 0)),
  CONSTRAINT `courses_prolearningquizquestion_chk_2` CHECK ((`order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_prolearningquizquestion`
--

LOCK TABLES `courses_prolearningquizquestion` WRITE;
/*!40000 ALTER TABLE `courses_prolearningquizquestion` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_prolearningquizquestion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_prolearningresource`
--

DROP TABLE IF EXISTS `courses_prolearningresource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_prolearningresource` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `order` int unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `topic_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_prolearningr_topic_id_a70c6add_fk_courses_p` (`topic_id`),
  CONSTRAINT `courses_prolearningr_topic_id_a70c6add_fk_courses_p` FOREIGN KEY (`topic_id`) REFERENCES `courses_prolearningtopic` (`id`),
  CONSTRAINT `courses_prolearningresource_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_prolearningresource`
--

LOCK TABLES `courses_prolearningresource` WRITE;
/*!40000 ALTER TABLE `courses_prolearningresource` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_prolearningresource` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_prolearningtopic`
--

DROP TABLE IF EXISTS `courses_prolearningtopic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_prolearningtopic` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `topic_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int unsigned NOT NULL,
  `reading_material` longtext COLLATE utf8mb4_unicode_ci,
  `summary` longtext COLLATE utf8mb4_unicode_ci,
  `is_completed` tinyint(1) NOT NULL,
  `progress_percentage` decimal(5,2) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `course_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_prolearningtopic_course_id_order_a2d6c6af_uniq` (`course_id`,`order`),
  CONSTRAINT `courses_prolearningt_course_id_1c76f6c7_fk_courses_p` FOREIGN KEY (`course_id`) REFERENCES `courses_prolearningcourse` (`id`),
  CONSTRAINT `courses_prolearningtopic_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_prolearningtopic`
--

LOCK TABLES `courses_prolearningtopic` WRITE;
/*!40000 ALTER TABLE `courses_prolearningtopic` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_prolearningtopic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_prolearningvideo`
--

DROP TABLE IF EXISTS `courses_prolearningvideo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_prolearningvideo` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `duration` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` int unsigned NOT NULL,
  `is_watched` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `topic_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_prolearningv_topic_id_d8e6da15_fk_courses_p` (`topic_id`),
  CONSTRAINT `courses_prolearningv_topic_id_d8e6da15_fk_courses_p` FOREIGN KEY (`topic_id`) REFERENCES `courses_prolearningtopic` (`id`),
  CONSTRAINT `courses_prolearningvideo_chk_1` CHECK ((`order` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_prolearningvideo`
--

LOCK TABLES `courses_prolearningvideo` WRITE;
/*!40000 ALTER TABLE `courses_prolearningvideo` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_prolearningvideo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_quizquestion`
--

DROP TABLE IF EXISTS `courses_quizquestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_quizquestion` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `question` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json NOT NULL,
  `correct_answer` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lesson_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_quizquestion_lesson_id_892e26cb_fk_courses_lesson_id` (`lesson_id`),
  CONSTRAINT `courses_quizquestion_lesson_id_892e26cb_fk_courses_lesson_id` FOREIGN KEY (`lesson_id`) REFERENCES `courses_lesson` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_quizquestion`
--

LOCK TABLES `courses_quizquestion` WRITE;
/*!40000 ALTER TABLE `courses_quizquestion` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_quizquestion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_quizresult`
--

DROP TABLE IF EXISTS `courses_quizresult`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_quizresult` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `answers` json NOT NULL,
  `score` double NOT NULL,
  `total_questions` int unsigned NOT NULL,
  `passed` tinyint(1) NOT NULL,
  `submitted_at` datetime(6) NOT NULL,
  `lesson_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courses_quizresult_lesson_id_d2615e95_fk_courses_lesson_id` (`lesson_id`),
  KEY `idx_user_lesson_quiz` (`user_id`,`lesson_id`),
  KEY `idx_quiz_submitted_at` (`submitted_at`),
  CONSTRAINT `courses_quizresult_lesson_id_d2615e95_fk_courses_lesson_id` FOREIGN KEY (`lesson_id`) REFERENCES `courses_lesson` (`id`),
  CONSTRAINT `courses_quizresult_user_id_5ef01900_fk_authentication_user_id` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`),
  CONSTRAINT `courses_quizresult_chk_1` CHECK ((`total_questions` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_quizresult`
--

LOCK TABLES `courses_quizresult` WRITE;
/*!40000 ALTER TABLE `courses_quizresult` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_quizresult` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_schoolcourse`
--

DROP TABLE IF EXISTS `courses_schoolcourse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_schoolcourse` (
  `id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `thumbnail` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_updated` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `is_published` tinyint(1) NOT NULL,
  `class_level` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `board` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sources` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `key_topics` json NOT NULL,
  `learning_points` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_schoolcourse`
--

LOCK TABLES `courses_schoolcourse` WRITE;
/*!40000 ALTER TABLE `courses_schoolcourse` DISABLE KEYS */;
INSERT INTO `courses_schoolcourse` VALUES ('0263526064ec43a4aece653ad8452c4d','7th Science - Telangana State Board','Complete Science curriculum for 7th Telangana State Board students','Comprehensive Science course covering the entire 7th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.537879',1,'7th','state','Telangana','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('04712ae804bf4a43b7bf680dcd1e62f3','7th Science - CBSE','Complete Science curriculum for 7th CBSE students','Comprehensive Science course covering the entire 7th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.488071',1,'7th','cbse','','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('08d932a7c4034921b1d84ddcdaef65b9','7th English - CBSE','Complete English curriculum for 7th CBSE students','Comprehensive English course covering the entire 7th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.597967',1,'7th','cbse','','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('1399abf1f9cb4d868c4a2a5b3a4d2a2b','9th Social Science - CBSE','Complete Social Science curriculum for 9th CBSE students','Comprehensive Social Science course covering the entire 9th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.847064',1,'9th','cbse','','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('143f064c2e4f499bab07958f895ba351','6th Mathematics - Telangana State Board','Complete Mathematics curriculum for 6th Telangana State Board students','Comprehensive Mathematics course covering the entire 6th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:05.883544',1,'6th','state','Telangana','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('152c8a814b8e4a45927d6c0eb780ddcb','6th Hindi - CBSE','Complete Hindi curriculum for 6th CBSE students','Comprehensive Hindi course covering the entire 6th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.179865',1,'6th','cbse','','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('1b94a8e4a46744118a111f5cb0165c2d','9th English - CBSE','Complete English curriculum for 9th CBSE students','Comprehensive English course covering the entire 9th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.627400',1,'9th','cbse','','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('1c0339a0931a4fb49509467f16717374','6th Social Science - Telangana State Board','Complete Social Science curriculum for 6th Telangana State Board students','Comprehensive Social Science course covering the entire 6th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.328825',1,'6th','state','Telangana','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('1f812a4886ad479eaa17f83b07777628','6th Science - CBSE','Complete Science curriculum for 6th CBSE students','Comprehensive Science course covering the entire 6th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:05.957643',1,'6th','cbse','','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('2b774408fa0548899178e928d08d3011','7th Social Science - CBSE','Complete Social Science curriculum for 7th CBSE students','Comprehensive Social Science course covering the entire 7th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.798813',1,'7th','cbse','','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('2c5f5fb2e5934612aeb4d2cbe7218baa','8th Mathematics - CBSE','Complete Mathematics curriculum for 8th CBSE students','Comprehensive Mathematics course covering the entire 8th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.908359',1,'8th','cbse','','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('33add8b5bb43429a92df8b58aa9d6666','7th Mathematics - Andhra Pradesh State Board','Complete Mathematics curriculum for 7th Andhra Pradesh State Board students','Comprehensive Mathematics course covering the entire 7th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.457465',1,'7th','state','Andhra Pradesh','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('3a5acc63739242bf80e1b39e4d6e42c8','8th Science - Telangana State Board','Complete Science curriculum for 8th Telangana State Board students','Comprehensive Science course covering the entire 8th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.064495',1,'8th','state','Telangana','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('3c72241765d544a396c4b5744f72b4f5','8th Hindi - CBSE','Complete Hindi curriculum for 8th CBSE students','Comprehensive Hindi course covering the entire 8th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.213999',1,'8th','cbse','','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('3e84fb3ea30e41608ac96f74de27eab6','6th Mathematics - Andhra Pradesh State Board','Complete Mathematics curriculum for 6th Andhra Pradesh State Board students','Comprehensive Mathematics course covering the entire 6th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:05.929454',1,'6th','state','Andhra Pradesh','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('3f05dabd85ca4f969590d75fca088a7e','7th English - Telangana State Board','Complete English curriculum for 7th Telangana State Board students','Comprehensive English course covering the entire 7th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.648255',1,'7th','state','Telangana','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('4229a23d77834be49264688ef31e635b','9th Social Science - Andhra Pradesh State Board','Complete Social Science curriculum for 9th Andhra Pradesh State Board students','Comprehensive Social Science course covering the entire 9th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.918993',1,'9th','state','Andhra Pradesh','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('4391376c912d4826adda23354cd29c66','8th Social Science - CBSE','Complete Social Science curriculum for 8th CBSE students','Comprehensive Social Science course covering the entire 8th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.314831',1,'8th','cbse','','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('471e82e92786479392fe5860629c7b96','9th Hindi - CBSE','Complete Hindi curriculum for 9th CBSE students','Comprehensive Hindi course covering the entire 9th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.733394',1,'9th','cbse','','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('4a63d31dd502450e99e55e4e17b1fa47','6th Hindi - Andhra Pradesh State Board','Complete Hindi curriculum for 6th Andhra Pradesh State Board students','Comprehensive Hindi course covering the entire 6th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.258550',1,'6th','state','Andhra Pradesh','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('4cc067aa4c65419cb2b3c112afa5d7ad','9th Mathematics - CBSE','Complete Mathematics curriculum for 9th CBSE students','Comprehensive Mathematics course covering the entire 9th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.411578',1,'9th','cbse','','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('51d457c075ff46958df414a857ca8123','8th Hindi - Andhra Pradesh State Board','Complete Hindi curriculum for 8th Andhra Pradesh State Board students','Comprehensive Hindi course covering the entire 8th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.285518',1,'8th','state','Andhra Pradesh','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('52c494a4a20846f8afccc56c063b81a2','6th Hindi - Telangana State Board','Complete Hindi curriculum for 6th Telangana State Board students','Comprehensive Hindi course covering the entire 6th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.228072',1,'6th','state','Telangana','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('538d64a3d6ab40928b90b60527d3b693','8th Social Science - Andhra Pradesh State Board','Complete Social Science curriculum for 8th Andhra Pradesh State Board students','Comprehensive Social Science course covering the entire 8th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.384699',1,'8th','state','Andhra Pradesh','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('5e4fcfaa29b14fcaab1ff4f772d0e619','9th English - Andhra Pradesh State Board','Complete English curriculum for 9th Andhra Pradesh State Board students','Comprehensive English course covering the entire 9th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.695850',1,'9th','state','Andhra Pradesh','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('5e9e79ceb179436bbb21c1c114b7cef9','9th Science - CBSE','Complete Science curriculum for 9th CBSE students','Comprehensive Science course covering the entire 9th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.503602',1,'9th','cbse','','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('5ead663fbc5049619429eccc067b29d1','7th Social Science - Telangana State Board','Complete Social Science curriculum for 7th Telangana State Board students','Comprehensive Social Science course covering the entire 7th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.844571',1,'7th','state','Telangana','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('60a0760ed19747279215eb1888166c63','7th Social Science - Andhra Pradesh State Board','Complete Social Science curriculum for 7th Andhra Pradesh State Board students','Comprehensive Social Science course covering the entire 7th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.876079',1,'7th','state','Andhra Pradesh','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('6607096986c24e8385c91e41b61173ec','6th English - CBSE','Complete English curriculum for 6th CBSE students','Comprehensive English course covering the entire 6th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.072330',1,'6th','cbse','','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('6dc63a49712c4e7da5559df1c796a6f1','8th Hindi - Telangana State Board','Complete Hindi curriculum for 8th Telangana State Board students','Comprehensive Hindi course covering the entire 8th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.257465',1,'8th','state','Telangana','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('6fd35d8dd5a448378ceeba32c4851dba','7th Mathematics - CBSE','Complete Mathematics curriculum for 7th CBSE students','Comprehensive Mathematics course covering the entire 7th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.387356',1,'7th','cbse','','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('8787bd0ac9494d43b8542a8517f40984','6th Science - Andhra Pradesh State Board','Complete Science curriculum for 6th Andhra Pradesh State Board students','Comprehensive Science course covering the entire 6th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.042332',1,'6th','state','Andhra Pradesh','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('8c0bddf9b3a748e3be9c86626ac068bd','7th Hindi - CBSE','Complete Hindi curriculum for 7th CBSE students','Comprehensive Hindi course covering the entire 7th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.703413',1,'7th','cbse','','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('8cb3ce3fe84c433ab0f56718d38e0075','8th Science - Andhra Pradesh State Board','Complete Science curriculum for 8th Andhra Pradesh State Board students','Comprehensive Science course covering the entire 8th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.092478',1,'8th','state','Andhra Pradesh','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('92f1388baa63412ab2502f5981439991','7th Science - Andhra Pradesh State Board','Complete Science curriculum for 7th Andhra Pradesh State Board students','Comprehensive Science course covering the entire 7th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.570890',1,'7th','state','Andhra Pradesh','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('959c1124e00446568159e4fc6f6a548f','8th Social Science - Telangana State Board','Complete Social Science curriculum for 8th Telangana State Board students','Comprehensive Social Science course covering the entire 8th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.355846',1,'8th','state','Telangana','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('97a12c22235042178869a1436e028207','9th English - Telangana State Board','Complete English curriculum for 9th Telangana State Board students','Comprehensive English course covering the entire 9th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.666449',1,'9th','state','Telangana','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('9a5a2c7798884a19abb9d8a85055cf0a','7th Hindi - Andhra Pradesh State Board','Complete Hindi curriculum for 7th Andhra Pradesh State Board students','Comprehensive Hindi course covering the entire 7th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.772766',1,'7th','state','Andhra Pradesh','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('9a5ec7fb91854a1f97150edf2339e005','6th Social Science - CBSE','Complete Social Science curriculum for 6th CBSE students','Comprehensive Social Science course covering the entire 6th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:06.287553',1,'6th','cbse','','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('9be84648116d4b52a6e9fed50d399145','8th English - Telangana State Board','Complete English curriculum for 8th Telangana State Board students','Comprehensive English course covering the entire 8th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.162326',1,'8th','state','Telangana','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('9c8b582d2eef45f68d56008003de94e1','9th Science - Telangana State Board','Complete Science curriculum for 9th Telangana State Board students','Comprehensive Science course covering the entire 9th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.566255',1,'9th','state','Telangana','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('a7fbc8b62f924227822a86f5de6da785','9th Hindi - Andhra Pradesh State Board','Complete Hindi curriculum for 9th Andhra Pradesh State Board students','Comprehensive Hindi course covering the entire 9th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.818053',1,'9th','state','Andhra Pradesh','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('b30dec6136414b449c59ea5247457a5e','9th Mathematics - Telangana State Board','Complete Mathematics curriculum for 9th Telangana State Board students','Comprehensive Mathematics course covering the entire 9th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.450177',1,'9th','state','Telangana','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('b3c489b0b4b2455ea177dafd18c3d737','7th Mathematics - Telangana State Board','Complete Mathematics curriculum for 7th Telangana State Board students','Comprehensive Mathematics course covering the entire 7th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.427935',1,'7th','state','Telangana','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('b8c0a11db981472a8bc6cbee4d5e3011','6th English - Telangana State Board','Complete English curriculum for 6th Telangana State Board students','Comprehensive English course covering the entire 6th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.120947',1,'6th','state','Telangana','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('b9f7caaf1cdc4ac8a099084b3fd38a36','6th Social Science - Andhra Pradesh State Board','Complete Social Science curriculum for 6th Andhra Pradesh State Board students','Comprehensive Social Science course covering the entire 6th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.360825',1,'6th','state','Andhra Pradesh','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('ba2a49b878054d5bbd273aed19dd87b6','8th English - Andhra Pradesh State Board','Complete English curriculum for 8th Andhra Pradesh State Board students','Comprehensive English course covering the entire 8th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.188753',1,'8th','state','Andhra Pradesh','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('bad86465fe9f4f4cbde31176a7946e60','9th Science - Andhra Pradesh State Board','Complete Science curriculum for 9th Andhra Pradesh State Board students','Comprehensive Science course covering the entire 9th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.599206',1,'9th','state','Andhra Pradesh','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('bb88413cf1834aa0ba0fb7d27c68b113','8th Science - CBSE','Complete Science curriculum for 8th CBSE students','Comprehensive Science course covering the entire 8th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.024417',1,'8th','cbse','','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('cc7e5d5b927d47a79f9c8c27192e589b','9th Mathematics - Andhra Pradesh State Board','Complete Mathematics curriculum for 9th Andhra Pradesh State Board students','Comprehensive Mathematics course covering the entire 9th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.479866',1,'9th','state','Andhra Pradesh','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('cf5d7f424860401294d680342d0b7105','8th Mathematics - Telangana State Board','Complete Mathematics curriculum for 8th Telangana State Board students','Comprehensive Mathematics course covering the entire 8th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.953022',1,'8th','state','Telangana','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('cf991bade55e4c8f8c235e38e4eb3c3e','8th English - CBSE','Complete English curriculum for 8th CBSE students','Comprehensive English course covering the entire 8th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:07.121287',1,'8th','cbse','','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('d1e98753083f4bd48ad2e67cbcbf2b08','9th Hindi - Telangana State Board','Complete Hindi curriculum for 9th Telangana State Board students','Comprehensive Hindi course covering the entire 9th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.775864',1,'9th','state','Telangana','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('d1f0e610e45f4c8392cc7bb7d5b6a38c','6th English - Andhra Pradesh State Board','Complete English curriculum for 6th Andhra Pradesh State Board students','Comprehensive English course covering the entire 6th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.149510',1,'6th','state','Andhra Pradesh','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('d5d03b0a49a6419dbb0bf258192cc300','6th Mathematics - CBSE','Complete Mathematics curriculum for 6th CBSE students','Comprehensive Mathematics course covering the entire 6th CBSE syllabus with detailed explanations, examples, and practice questions.','','50','2025-10-10','2025-10-10 05:55:05.818132',1,'6th','cbse','','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('db5652e4b7e64625a4c7ccd89e218aea','7th English - Andhra Pradesh State Board','Complete English curriculum for 7th Andhra Pradesh State Board students','Comprehensive English course covering the entire 7th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.676365',1,'7th','state','Andhra Pradesh','English','','[\"English Basics\", \"Advanced English\", \"English Problem Solving\"]','[\"Master English concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('df7685ec795f4984a6abd480a9c28cee','6th Science - Telangana State Board','Complete Science curriculum for 6th Telangana State Board students','Comprehensive Science course covering the entire 6th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.010598',1,'6th','state','Telangana','Science','','[\"Science Basics\", \"Advanced Science\", \"Science Problem Solving\"]','[\"Master Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('e6bf3dd4b2cc4fd6b0720fcf57736a76','7th Hindi - Telangana State Board','Complete Hindi curriculum for 7th Telangana State Board students','Comprehensive Hindi course covering the entire 7th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.747708',1,'7th','state','Telangana','Hindi','','[\"Hindi Basics\", \"Advanced Hindi\", \"Hindi Problem Solving\"]','[\"Master Hindi concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('e8b46bf7c74f4a29bbbf3e6f18dac8ad','9th Social Science - Telangana State Board','Complete Social Science curriculum for 9th Telangana State Board students','Comprehensive Social Science course covering the entire 9th Telangana State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:07.885051',1,'9th','state','Telangana','Social Science','','[\"Social Science Basics\", \"Advanced Social Science\", \"Social Science Problem Solving\"]','[\"Master Social Science concepts\", \"Solve complex problems\", \"Build strong foundation\"]'),('fb518b27bb2a4ba5bd6012f2e1b05a5a','8th Mathematics - Andhra Pradesh State Board','Complete Mathematics curriculum for 8th Andhra Pradesh State Board students','Comprehensive Mathematics course covering the entire 8th Andhra Pradesh State Board syllabus with detailed explanations, examples, and practice questions.','','45','2025-10-10','2025-10-10 05:55:06.985020',1,'8th','state','Andhra Pradesh','Mathematics','','[\"Mathematics Basics\", \"Advanced Mathematics\", \"Mathematics Problem Solving\"]','[\"Master Mathematics concepts\", \"Solve complex problems\", \"Build strong foundation\"]');
/*!40000 ALTER TABLE `courses_schoolcourse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_userlessonprogress`
--

DROP TABLE IF EXISTS `courses_userlessonprogress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_userlessonprogress` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) NOT NULL,
  `lesson_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_userlessonprogress_user_id_lesson_id_baa7f2c2_uniq` (`user_id`,`lesson_id`),
  KEY `courses_userlessonpr_lesson_id_f0441449_fk_courses_l` (`lesson_id`),
  CONSTRAINT `courses_userlessonpr_lesson_id_f0441449_fk_courses_l` FOREIGN KEY (`lesson_id`) REFERENCES `courses_lesson` (`id`),
  CONSTRAINT `courses_userlessonpr_user_id_4cba9dde_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_userlessonprogress`
--

LOCK TABLES `courses_userlessonprogress` WRITE;
/*!40000 ALTER TABLE `courses_userlessonprogress` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_userlessonprogress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses_userstartedpredefinedcourse`
--

DROP TABLE IF EXISTS `courses_userstartedpredefinedcourse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses_userstartedpredefinedcourse` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `course_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `class_level` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `board` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `progress_percentage` decimal(5,2) NOT NULL,
  `is_completed` tinyint(1) NOT NULL,
  `started_at` datetime(6) NOT NULL,
  `last_activity` datetime(6) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `engineering_course_id` char(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_accessed_lesson_id` bigint DEFAULT NULL,
  `school_course_id` char(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_userstartedprede_user_id_engineering_cour_d1bc524e_uniq` (`user_id`,`engineering_course_id`),
  UNIQUE KEY `courses_userstartedprede_user_id_school_course_id_2caa66e5_uniq` (`user_id`,`school_course_id`),
  KEY `courses_userstartedp_engineering_course_i_1dc1fd1e_fk_courses_e` (`engineering_course_id`),
  KEY `courses_userstartedp_last_accessed_lesson_7834dbc2_fk_courses_l` (`last_accessed_lesson_id`),
  KEY `courses_userstartedp_school_course_id_b7969eef_fk_courses_s` (`school_course_id`),
  KEY `idx_user_course_type` (`user_id`,`course_type`),
  KEY `idx_course_started_at` (`started_at`),
  KEY `idx_course_progress` (`progress_percentage`),
  CONSTRAINT `courses_userstartedp_engineering_course_i_1dc1fd1e_fk_courses_e` FOREIGN KEY (`engineering_course_id`) REFERENCES `courses_engineeringcourse` (`id`),
  CONSTRAINT `courses_userstartedp_last_accessed_lesson_7834dbc2_fk_courses_l` FOREIGN KEY (`last_accessed_lesson_id`) REFERENCES `courses_lesson` (`id`),
  CONSTRAINT `courses_userstartedp_school_course_id_b7969eef_fk_courses_s` FOREIGN KEY (`school_course_id`) REFERENCES `courses_schoolcourse` (`id`),
  CONSTRAINT `courses_userstartedp_user_id_b7c92c69_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses_userstartedpredefinedcourse`
--

LOCK TABLES `courses_userstartedpredefinedcourse` WRITE;
/*!40000 ALTER TABLE `courses_userstartedpredefinedcourse` DISABLE KEYS */;
/*!40000 ALTER TABLE `courses_userstartedpredefinedcourse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_authentication_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_authentication_user_id` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(7,'authentication','emailotp'),(6,'authentication','user'),(4,'contenttypes','contenttype'),(24,'courses','certification'),(8,'courses','coursechapter'),(11,'courses','coursesection'),(10,'courses','engineeringcourse'),(23,'courses','learningactivity'),(12,'courses','lesson'),(13,'courses','lessonresource'),(17,'courses','prolearningcourse'),(20,'courses','prolearningquizquestion'),(19,'courses','prolearningresource'),(18,'courses','prolearningtopic'),(21,'courses','prolearningvideo'),(14,'courses','quizquestion'),(15,'courses','quizresult'),(9,'courses','schoolcourse'),(16,'courses','userlessonprogress'),(22,'courses','userstartedpredefinedcourse'),(25,'feedback','feedback'),(26,'newsletter','newsletter'),(5,'sessions','session'),(27,'social_django','association'),(28,'social_django','code'),(29,'social_django','nonce'),(31,'social_django','partial'),(30,'social_django','usersocialauth'),(32,'tracking','useractivity');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2025-10-10 05:28:35.611411'),(2,'contenttypes','0002_remove_content_type_name','2025-10-10 05:28:35.771490'),(3,'auth','0001_initial','2025-10-10 05:28:36.171499'),(4,'auth','0002_alter_permission_name_max_length','2025-10-10 05:28:36.252361'),(5,'auth','0003_alter_user_email_max_length','2025-10-10 05:28:36.260109'),(6,'auth','0004_alter_user_username_opts','2025-10-10 05:28:36.269869'),(7,'auth','0005_alter_user_last_login_null','2025-10-10 05:28:36.280873'),(8,'auth','0006_require_contenttypes_0002','2025-10-10 05:28:36.287866'),(9,'auth','0007_alter_validators_add_error_messages','2025-10-10 05:28:36.300360'),(10,'auth','0008_alter_user_username_max_length','2025-10-10 05:28:36.309389'),(11,'auth','0009_alter_user_last_name_max_length','2025-10-10 05:28:36.320393'),(12,'auth','0010_alter_group_name_max_length','2025-10-10 05:28:36.344392'),(13,'auth','0011_update_proxy_permissions','2025-10-10 05:28:36.359450'),(14,'auth','0012_alter_user_first_name_max_length','2025-10-10 05:28:36.371988'),(15,'authentication','0001_initial','2025-10-10 05:28:36.845729'),(16,'admin','0001_initial','2025-10-10 05:28:37.076275'),(17,'admin','0002_logentry_remove_auto_add','2025-10-10 05:28:37.087341'),(18,'admin','0003_logentry_add_action_flag_choices','2025-10-10 05:28:37.100578'),(19,'authentication','0002_user_agreed_to_terms_user_board_of_education_and_more','2025-10-10 05:28:37.365109'),(20,'authentication','0003_remove_user_board_of_education_and_more','2025-10-10 05:28:37.449316'),(21,'authentication','0004_remove_user_class_level_remove_user_country','2025-10-10 05:28:37.599341'),(22,'authentication','0005_user_auth_method','2025-10-10 05:28:37.695310'),(23,'authentication','0006_alter_user_auth_method','2025-10-10 05:28:37.706020'),(24,'authentication','0007_emailotp','2025-10-10 05:28:37.848014'),(25,'courses','0001_initial','2025-10-10 05:28:39.322790'),(26,'courses','0002_alter_schoolcourse_class_level','2025-10-10 05:28:39.328791'),(27,'courses','0003_delete_ailearningplan','2025-10-10 05:28:39.357830'),(28,'courses','0004_prolearningcourse_prolearningtopic_and_more','2025-10-10 05:28:40.024253'),(29,'courses','0005_userstartedpredefinedcourse','2025-10-10 05:28:40.574204'),(30,'courses','0006_learningactivity','2025-10-10 05:28:40.754743'),(31,'courses','0007_auto_20250821_2242','2025-10-10 05:28:40.867860'),(32,'courses','0008_alter_prolearningresource_url_and_more','2025-10-10 05:28:40.886387'),(33,'courses','0009_certification','2025-10-10 05:28:41.248278'),(34,'courses','0010_coursedraft','2025-10-10 05:28:41.390966'),(35,'courses','0011_delete_coursedraft','2025-10-10 05:28:41.420962'),(36,'feedback','0001_initial','2025-10-10 05:28:41.454643'),(37,'newsletter','0001_initial','2025-10-10 05:28:41.503485'),(38,'sessions','0001_initial','2025-10-10 05:28:41.555506'),(39,'default','0001_initial','2025-10-10 05:28:41.886148'),(40,'social_auth','0001_initial','2025-10-10 05:28:41.891154'),(41,'default','0002_add_related_name','2025-10-10 05:28:41.915145'),(42,'social_auth','0002_add_related_name','2025-10-10 05:28:41.925146'),(43,'default','0003_alter_email_max_length','2025-10-10 05:28:41.946394'),(44,'social_auth','0003_alter_email_max_length','2025-10-10 05:28:41.952435'),(45,'default','0004_auto_20160423_0400','2025-10-10 05:28:41.971417'),(46,'social_auth','0004_auto_20160423_0400','2025-10-10 05:28:41.979205'),(47,'social_auth','0005_auto_20160727_2333','2025-10-10 05:28:42.022977'),(48,'social_django','0006_partial','2025-10-10 05:28:42.082987'),(49,'social_django','0007_code_timestamp','2025-10-10 05:28:42.213271'),(50,'social_django','0008_partial_timestamp','2025-10-10 05:28:42.315792'),(51,'social_django','0009_auto_20191118_0520','2025-10-10 05:28:42.519596'),(52,'social_django','0010_uid_db_index','2025-10-10 05:28:42.555600'),(53,'social_django','0011_alter_id_fields','2025-10-10 05:28:42.948834'),(54,'social_django','0012_usersocialauth_extra_data_new','2025-10-10 05:28:43.138796'),(55,'social_django','0013_migrate_extra_data','2025-10-10 05:28:43.168846'),(56,'social_django','0014_remove_usersocialauth_extra_data','2025-10-10 05:28:43.320356'),(57,'social_django','0015_rename_extra_data_new_usersocialauth_extra_data','2025-10-10 05:28:43.400342'),(58,'social_django','0016_alter_usersocialauth_extra_data','2025-10-10 05:28:43.415819'),(59,'social_django','0017_usersocialauth_user_social_auth_uid_required','2025-10-10 05:28:43.541496'),(60,'tracking','0001_initial','2025-10-10 05:28:43.771691'),(61,'social_django','0003_alter_email_max_length','2025-10-10 05:28:43.781313'),(62,'social_django','0004_auto_20160423_0400','2025-10-10 05:28:43.786322'),(63,'social_django','0001_initial','2025-10-10 05:28:43.792267'),(64,'social_django','0005_auto_20160727_2333','2025-10-10 05:28:43.797311'),(65,'social_django','0002_add_related_name','2025-10-10 05:28:43.801310');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback_feedback`
--

DROP TABLE IF EXISTS `feedback_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback_feedback`
--

LOCK TABLES `feedback_feedback` WRITE;
/*!40000 ALTER TABLE `feedback_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_newsletter`
--

DROP TABLE IF EXISTS `newsletter_newsletter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletter_newsletter` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subscribed_at` datetime(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_newsletter`
--

LOCK TABLES `newsletter_newsletter` WRITE;
/*!40000 ALTER TABLE `newsletter_newsletter` DISABLE KEYS */;
/*!40000 ALTER TABLE `newsletter_newsletter` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_auth_association`
--

DROP TABLE IF EXISTS `social_auth_association`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_auth_association` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `server_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `handle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issued` int NOT NULL,
  `lifetime` int NOT NULL,
  `assoc_type` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_auth_association_server_url_handle_078befa2_uniq` (`server_url`,`handle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_auth_association`
--

LOCK TABLES `social_auth_association` WRITE;
/*!40000 ALTER TABLE `social_auth_association` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_auth_association` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_auth_code`
--

DROP TABLE IF EXISTS `social_auth_code`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_auth_code` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verified` tinyint(1) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_auth_code_email_code_801b2d02_uniq` (`email`,`code`),
  KEY `social_auth_code_code_a2393167` (`code`),
  KEY `social_auth_code_timestamp_176b341f` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_auth_code`
--

LOCK TABLES `social_auth_code` WRITE;
/*!40000 ALTER TABLE `social_auth_code` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_auth_code` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_auth_nonce`
--

DROP TABLE IF EXISTS `social_auth_nonce`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_auth_nonce` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `server_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` int NOT NULL,
  `salt` varchar(65) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_auth_nonce_server_url_timestamp_salt_f6284463_uniq` (`server_url`,`timestamp`,`salt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_auth_nonce`
--

LOCK TABLES `social_auth_nonce` WRITE;
/*!40000 ALTER TABLE `social_auth_nonce` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_auth_nonce` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_auth_partial`
--

DROP TABLE IF EXISTS `social_auth_partial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_auth_partial` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `next_step` smallint unsigned NOT NULL,
  `backend` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `data` json NOT NULL DEFAULT (_utf8mb4'{}'),
  PRIMARY KEY (`id`),
  KEY `social_auth_partial_token_3017fea3` (`token`),
  KEY `social_auth_partial_timestamp_50f2119f` (`timestamp`),
  CONSTRAINT `social_auth_partial_chk_1` CHECK ((`next_step` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_auth_partial`
--

LOCK TABLES `social_auth_partial` WRITE;
/*!40000 ALTER TABLE `social_auth_partial` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_auth_partial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `social_auth_usersocialauth`
--

DROP TABLE IF EXISTS `social_auth_usersocialauth`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `social_auth_usersocialauth` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `provider` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `created` datetime(6) NOT NULL,
  `modified` datetime(6) NOT NULL,
  `extra_data` json NOT NULL DEFAULT (_utf8mb4'{}'),
  PRIMARY KEY (`id`),
  UNIQUE KEY `social_auth_usersocialauth_provider_uid_e6b5e668_uniq` (`provider`,`uid`),
  KEY `social_auth_usersoci_user_id_17d28448_fk_authentic` (`user_id`),
  KEY `social_auth_usersocialauth_uid_796e51dc` (`uid`),
  CONSTRAINT `social_auth_usersoci_user_id_17d28448_fk_authentic` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`),
  CONSTRAINT `user_social_auth_uid_required` CHECK ((`uid` <> _utf8mb4''))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `social_auth_usersocialauth`
--

LOCK TABLES `social_auth_usersocialauth` WRITE;
/*!40000 ALTER TABLE `social_auth_usersocialauth` DISABLE KEYS */;
/*!40000 ALTER TABLE `social_auth_usersocialauth` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tracking_useractivity`
--

DROP TABLE IF EXISTS `tracking_useractivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tracking_useractivity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `feature` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json NOT NULL,
  `latency_ms` int DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `error_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_ts` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tracking_useractivity_user_id_335dabd5_fk_authentication_user_id` (`user_id`),
  KEY `tracking_useractivity_session_id_94cb8686` (`session_id`),
  KEY `tracking_us_session_882b27_idx` (`session_id`,`created_at`),
  KEY `tracking_us_event_t_ab31e7_idx` (`event_type`,`created_at`),
  KEY `tracking_us_feature_72bfbb_idx` (`feature`,`created_at`),
  CONSTRAINT `tracking_useractivity_user_id_335dabd5_fk_authentication_user_id` FOREIGN KEY (`user_id`) REFERENCES `authentication_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tracking_useractivity`
--

LOCK TABLES `tracking_useractivity` WRITE;
/*!40000 ALTER TABLE `tracking_useractivity` DISABLE KEYS */;
/*!40000 ALTER TABLE `tracking_useractivity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'studentshub_db'
--

--
-- Dumping routines for database 'studentshub_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-10  5:55:48
