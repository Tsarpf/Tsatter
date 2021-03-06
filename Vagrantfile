ENV['VAGRANT_DEFAULT_PROVIDER'] = 'docker'

Vagrant.configure("2") do |config|

  config.vm.synced_folder ".", "/vagrant", disabled: true

  config.vm.provider "docker" do |d|
    d.remains_running = true
    d.vagrant_machine = "ubuntu_dockerhost"
    d.vagrant_vagrantfile = "./dockerhost/Vagrantfile"
  end

  config.vm.define "db" do |a|
    a.vm.provider "docker" do |d|
      d.name = "db"
      d.image = "mongo"
    end
  end


  config.vm.define "inspirk" do |a|
    a.vm.synced_folder "inspircd/conf", "/inspircd/conf"
    a.vm.provider "docker" do |d|
      d.name = "inspirk"
      d.build_dir = "./inspircd"
    end
  end

  config.vm.define "nodeapp" do |a|
    a.vm.synced_folder "nodeapp/environment/", "/home/nonroot/environment/src"
    a.vm.provider "docker" do |d|
      d.name = "nodeapp"
      d.image = "tsatter/web"
      d.ports = ["3000:3000"]
      d.link("db:db_1")
      d.link("inspirk:ircserver")
      d.cmd = ["tail", "-f", "server-out.log"]
    end
    a.ssh.username = "nonroot"
    a.ssh.private_key_path = "nodeapp_key"
  end

  config.vm.define "nginx" do |a|
    a.vm.synced_folder "nginx-container/logs", "/var/log/nginx/"
    a.vm.synced_folder "nodeapp/environment/dist", "/var/www/dist"
    a.vm.synced_folder "nginx-container/sites-enabled", "/etc/nginx/sites-enabled"
    a.vm.provider "docker" do |d|
      d.name = "nginx"
      d.image = "tsarpf/nginx"
      d.ports = ["80:80"]
      d.link("nodeapp:nodeapp")
    end
  end

end
